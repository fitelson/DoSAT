import type { Context, Model, Tactic, Z3HighLevel } from 'z3-solver'
import { is_compiled_decision_problem, type CompiledDecisionProblem } from './causal_decision'
import { div0_conditions_in_constraint_or_real_expr } from './pr_sat'
import { constraint_to_bool, real_expr_to_arith } from './z3_integration'
import type { PrSat } from './types'

type RealExpr = PrSat['RealExpr']
export type DecisionStage = 'premises' | 'counterexample' | 'witness'
export type DecisionEngine = 'fast' | 'complete'
export const DEFAULT_FAST_ATTEMPT_MS = 60_000
export type ExactDecisionValue = { defined: true, value: string } | { defined: false }

/** Plain data: no solver, context, model, or evaluator survives in a result. */
export type DecisionWitness = {
  mechanisms: { node: string, parents: Record<string, boolean>, parameter: string, value: string }[]
  queries: ({ source: string } & ExactDecisionValue)[]
  freeParameters: { variable: string, value: string }[]
  distributions: {
    label: string
    intervention: { variable: string, value: boolean }[]
    rows: { assignment: Record<string, boolean>, value: string }[]
  }[]
}

export type CausalDecisionResult =
  | { status: 'sat', witness: DecisionWitness }
  | { status: 'not-entailed', witness: DecisionWitness }
  | { status: 'unsat' }
  | { status: 'entailed' }
  | { status: 'unknown', stage: DecisionStage, reason: string }
  | { status: 'cancelled', stage: DecisionStage, reason: string }
  | { status: 'error', stage: DecisionStage, message: string }

export type CausalDecisionOptions = {
  /** Zero is unbounded. A positive requested deadline covers the query and extraction.
   * Native interruption and settlement can finish after that deadline. */
  timeout_ms?: number
  /** Finite QF_NRA attempt budget per stage; UNKNOWN/expiry falls back to NLSat. */
  fast_timeout_ms?: number
  abort_signal?: AbortSignal
  on_stage?: (stage: DecisionStage) => void
  on_engine?: (engine: DecisionEngine, stage: 'premises' | 'counterexample') => void
}

/** Small dependency boundary for lifecycle tests; ordinary callers use the Z3 constructor. */
export interface DecisionSession {
  load(input: string, timeout_ms: number): void
  check(): Promise<'sat' | 'unsat' | 'unknown'>
  reasonUnknown(): string
  validateOriginal(compiled: CompiledDecisionProblem): Promise<boolean>
  evaluateExact(expression: RealExpr): Promise<ExactDecisionValue>
  interrupt(): void
  release(): void
}
export type DecisionSessionFactory = (engine: DecisionEngine) => DecisionSession

const qfnra_sessions = (z3: Z3HighLevel): DecisionSessionFactory => {
  // The high-level API releases contexts through its finalizer, not an explicit
  // dispose method. Reuse one context per wrapper, rather than allocate
  // an unreclaimed context for every solve. Solver/model handles are eager-owned.
  let context: Context<'PrSATdo_decision'> | undefined
  let completeTactic: Tactic<'PrSATdo_decision'> | undefined
  return engine => {
    context ??= new z3.Context('PrSATdo_decision')
    const usedContext = context
    // The mixed QF_NRA portfolio is a finite-budget optimization. Completeness
    // comes from the explicit NLSat fallback, not the surrounding portfolio.
    const solver = engine === 'fast' ? new usedContext.Solver('QF_NRA')
      : (completeTactic ??= new usedContext.Tactic('qfnra-nlsat')).solver()
    let model: Model<'PrSATdo_decision'> | undefined
    return {
      load(input, timeout_ms) {
        solver.set('timeout', timeout_ms)
        solver.fromString(input)
      },
      check: () => solver.check(),
      reasonUnknown: () => solver.reasonUnknown(),
      async validateOriginal(compiled) {
        model ??= solver.model()
        const original = [...compiled.causal.constraints.slice(0, compiled.causal.mechanisms.length * 2), ...compiled.premiseConstraints]
        for (const constraint of original) {
          const value = await usedContext.simplify(model.eval(constraint_to_bool(usedContext, model, constraint), true))
          if (!usedContext.isTrue(value)) return false
        }
        if (compiled.task === 'entailment') {
          if (!compiled.conclusionConstraint) return false
          const value = await usedContext.simplify(model.eval(constraint_to_bool(usedContext, model, compiled.conclusionConstraint), true))
          return usedContext.isFalse(value)
        }
        return true
      },
      async evaluateExact(expression) {
        model ??= solver.model()
        for (const guard of div0_conditions_in_constraint_or_real_expr({ tag: 'real_expr', real_expr: expression })) {
          const value = model.eval(constraint_to_bool(usedContext, model, guard), true)
          if (!usedContext.isTrue(value)) return { defined: false }
        }
        const evaluated = model.eval(real_expr_to_arith(usedContext, model, expression), true)
        return { defined: true, value: (await usedContext.simplify(evaluated)).sexpr() }
      },
      interrupt: () => usedContext.interrupt(),
      release() {
        // Always release the solver even if model release itself fails.
        try { model?.release() } finally { solver.release() }
      },
    }
  }
}

const message_of = (error: unknown): string => error instanceof Error ? error.message : String(error)

/**
 * Finite-budget QF_NRA attempts followed by explicit complete NLSat search on
 * the compiler's polynomial encoding. An
 * interrupted, bounded, or failed run remains unresolved; it is never a theorem.
 * One wrapper owns one reusable context and must not be used concurrently.
 */
export class CausalDecisionSolver {
  private running = false
  private readonly createSession: DecisionSessionFactory

  constructor(z3: Z3HighLevel, sessionFactory?: DecisionSessionFactory) {
    this.createSession = sessionFactory ?? qfnra_sessions(z3)
  }

  async decide(compiled: CompiledDecisionProblem, options: CausalDecisionOptions = {}): Promise<CausalDecisionResult> {
    let stage: DecisionStage = is_compiled_decision_problem(compiled) && compiled.task === 'entailment' ? 'counterexample' : 'premises'
    const signal = options.abort_signal
    if (signal?.aborted) return { status: 'cancelled', stage, reason: 'Cancelled before the decision run started.' }
    if (this.running) return { status: 'error', stage, message: 'This decision solver is already running.' }
    const timeout = options.timeout_ms ?? 0
    const fastTimeout = options.fast_timeout_ms ?? DEFAULT_FAST_ATTEMPT_MS
    if (!Number.isSafeInteger(timeout) || timeout < 0 || timeout > 2_147_483_647) {
      return { status: 'error', stage, message: 'The decision time limit must be an integer from 0 to 2147483647 milliseconds; zero means unbounded.' }
    }
    if (!Number.isSafeInteger(fastTimeout) || fastTimeout < 1 || fastTimeout > 2_147_483_647) {
      return { status: 'error', stage, message: 'The fast attempt time limit must be an integer from 1 to 2147483647 milliseconds.' }
    }
    // Only canonical compiler output is accepted: callers cannot replace the
    // polynomial problem with arbitrary SMT commands or a different logic.
    if (!is_compiled_decision_problem(compiled)) {
      return { status: 'error', stage, message: 'Expected a problem returned by compile_decision_problem.' }
    }

    this.running = true
    let activeSession: DecisionSession | undefined
    let activeOperation: symbol | undefined
    let activeAttempt: { expired: boolean } | undefined
    let stopped: 'cancelled' | 'timeout' | undefined
    const deadline = timeout === 0 ? undefined : Date.now() + timeout
    let timer: ReturnType<typeof setTimeout> | undefined
    let interruptRetry: ReturnType<typeof setInterval> | undefined
    const clearInterruptRetry = (): void => {
      if (interruptRetry !== undefined) clearInterval(interruptRetry)
      interruptRetry = undefined
    }
    const sendInterrupt = (session: DecisionSession): void => {
      try { session.interrupt() } catch { /* the stopped result remains authoritative */ }
    }
    const interruptPendingOperation = (): void => {
      // Interrupt is advisory. The run still awaits the in-flight operation
      // before releasing its solver/model, or permitting a subsequent run.
      const session = activeSession, operation = activeOperation
      if (session === undefined || operation === undefined) return
      sendInterrupt(session)
      if (interruptRetry !== undefined) return
      // check() may be queued behind the binding's async mutex, so the first
      // interrupt can arrive before the native operation becomes interruptible.
      // Capture this operation's identity: a delayed callback cannot interrupt a
      // later operation or another run on the same reusable context.
      interruptRetry = setInterval(() => {
        if ((stopped !== undefined || activeAttempt?.expired) && activeSession === session && activeOperation === operation) sendInterrupt(session)
      }, 100)
    }
    const interrupt = (reason: 'cancelled' | 'timeout'): void => {
      stopped ??= reason
      interruptPendingOperation()
    }
    const onAbort = (): void => interrupt('cancelled')
    signal?.addEventListener('abort', onAbort, { once: true })
    if (signal?.aborted) onAbort()
    if (deadline !== undefined) timer = setTimeout(() => interrupt('timeout'), timeout)
    const stoppedResult = (): Extract<CausalDecisionResult, { status: 'unknown' | 'cancelled' }> | undefined => {
      if (stopped === undefined && deadline !== undefined && Date.now() >= deadline) interrupt('timeout')
      if (stopped === 'cancelled') return { status: 'cancelled', stage, reason: 'Decision run cancelled.' }
      if (stopped === 'timeout') return { status: 'unknown', stage, reason: 'The decision time limit was reached.' }
      return undefined
    }
    const changeStage = (next: DecisionStage): void => {
      stage = next
      options.on_stage?.(next)
    }
    const awaitOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
      const identity = Symbol('decision operation')
      activeOperation = identity
      try { return await operation() } finally {
        if (activeOperation === identity) activeOperation = undefined
        clearInterruptRetry()
      }
    }
    const snapshot = async (session: DecisionSession): Promise<DecisionWitness> => {
      if (stoppedResult()) throw new Error('Decision witness preparation interrupted.')
      const valid = await awaitOperation(() => session.validateOriginal(compiled))
      if (stoppedResult()) throw new Error('Decision witness preparation interrupted.')
      if (!valid) throw new Error('The returned model failed validation of the original guarded constraints.')
      const exact = async (expression: RealExpr): Promise<ExactDecisionValue> => {
        if (stoppedResult()) throw new Error('Decision witness preparation interrupted.')
        const value = await awaitOperation(() => session.evaluateExact(expression))
        if (stoppedResult()) throw new Error('Decision witness preparation interrupted.')
        return value
      }
      const defined = async (expression: RealExpr): Promise<string> => {
        const value = await exact(expression)
        if (!value.defined) throw new Error('A mechanism or distribution row unexpectedly has an undefined value.')
        return value.value
      }
      const witness: DecisionWitness = { mechanisms: [], queries: [], freeParameters: [], distributions: [] }
      for (const mechanism of compiled.causal.mechanisms) {
        witness.mechanisms.push({ node: mechanism.node, parents: { ...mechanism.parents }, parameter: mechanism.parameter, value: await defined(mechanism.expression) })
      }
      for (const query of compiled.causal.queries) witness.queries.push({ source: query.source, ...await exact(query.expression) })
      const mechanisms = new Set(compiled.causal.mechanisms.map(item => item.parameter))
      for (const variable of compiled.causal.variables.filter(name => !mechanisms.has(name))) {
        witness.freeParameters.push({ variable, value: await defined({ tag: 'variable', id: variable }) })
      }
      for (const distribution of compiled.causal.distributions) {
        const rows: DecisionWitness['distributions'][number]['rows'] = []
        for (const row of distribution.rows) rows.push({ assignment: { ...row.assignment }, value: await defined(row.expression) })
        witness.distributions.push({ label: distribution.label, intervention: distribution.intervention.map(item => ({ ...item })), rows })
      }
      return witness
    }
    type StageResult = { status: 'sat', witness?: DecisionWitness } | { status: 'unsat' } | Extract<CausalDecisionResult, { status: 'unknown' | 'cancelled' }>
    type AttemptResult = StageResult | { status: 'fast-expired' }
    const checkAttempt = async (input: string, withWitness: boolean, engine: DecisionEngine, problemStage: 'premises' | 'counterexample'): Promise<AttemptResult> => {
      const before = stoppedResult()
      if (before) return before
      const attempt = { expired: false }
      activeAttempt = attempt
      const fastDeadline = engine === 'fast' ? Date.now() + fastTimeout : undefined
      let fastTimer: ReturnType<typeof setTimeout> | undefined
      let session: DecisionSession | undefined
      let checking = false
      const clearFastTimer = (): void => {
        if (fastTimer !== undefined) clearTimeout(fastTimer)
        fastTimer = undefined
      }
      const fastExpired = (): boolean => {
        if (fastDeadline !== undefined && Date.now() >= fastDeadline) attempt.expired = true
        return attempt.expired
      }
      if (fastDeadline !== undefined) fastTimer = setTimeout(() => {
        // A host may already have queued this callback when cleanup clears its
        // timer. It belongs only to this attempt, never a later fallback/stage.
        if (activeAttempt !== attempt || fastTimer === undefined) return
        attempt.expired = true
        interruptPendingOperation()
      }, fastTimeout)
      try {
        options.on_engine?.(engine, problemStage)
        const afterAnnouncement = stoppedResult()
        if (afterAnnouncement) return afterAnnouncement
        session = this.createSession(engine)
        activeSession = session
        // The complete attempt gets the remaining whole-run budget. The fast
        // portfolio also gets a finite native timeout; its separate timer retries
        // interrupts if the native operation has not become interruptible yet.
        const overallRemaining = deadline === undefined ? 0 : Math.max(1, deadline - Date.now())
        const remaining = fastDeadline === undefined ? overallRemaining
          : Math.min(Math.max(1, fastDeadline - Date.now()), overallRemaining || fastTimeout)
        session.load(input, remaining)
        const afterLoad = stoppedResult()
        if (afterLoad) return afterLoad
        if (fastExpired()) return { status: 'fast-expired' }
        const usedSession = session
        checking = true
        const result = await awaitOperation(() => usedSession.check())
        checking = false
        clearFastTimer()
        const afterCheck = stoppedResult()
        if (afterCheck) return afterCheck
        if (fastExpired()) return { status: 'fast-expired' }
        if (result === 'unknown') return { status: 'unknown', stage, reason: session.reasonUnknown() || 'The solver did not settle this stage.' }
        if (result === 'sat' && withWitness) {
          changeStage('witness')
          return { status: 'sat', witness: await snapshot(session) }
        }
        return { status: result }
      } catch (error) {
        const stoppedNow = stoppedResult()
        if (stoppedNow) return stoppedNow
        // Some bindings reject an interrupted check instead of returning
        // UNKNOWN. Once a locally expired fast check settles either way, its
        // cleanup must still precede the complete fallback. Other errors remain
        // errors, including failures during exact witness extraction.
        if (checking && engine === 'fast' && fastExpired()) return { status: 'fast-expired' }
        throw error
      } finally {
        clearFastTimer()
        clearInterruptRetry()
        activeOperation = undefined
        activeAttempt = undefined
        activeSession = undefined
        session?.release()
      }
    }
    const checkStage = async (input: string, withWitness: boolean, problemStage: 'premises' | 'counterexample'): Promise<StageResult> => {
      const fast = await checkAttempt(input, withWitness, 'fast', problemStage)
      const afterFast = stoppedResult()
      if (afterFast) return afterFast
      if (fast.status !== 'fast-expired' && fast.status !== 'unknown') return fast
      // checkAttempt has settled and released the fast session before the
      // complete engine starts. Give a queued abort another delivery point.
      await Promise.resolve()
      const beforeComplete = stoppedResult()
      if (beforeComplete) return beforeComplete
      const complete = await checkAttempt(input, withWitness, 'complete', problemStage)
      if (complete.status === 'fast-expired') throw new Error('The complete NLSat attempt unexpectedly used a fast deadline.')
      return complete
    }

    try {
      if (compiled.task === 'satisfiability') {
        changeStage('premises')
        const premises = await checkStage(compiled.premisesSmt, true, 'premises')
        const afterPremises = stoppedResult()
        if (afterPremises) return afterPremises
        if (premises.status === 'unknown' || premises.status === 'cancelled') return premises
        if (premises.status === 'unsat') return { status: 'unsat' }
        if (!premises.witness) throw new Error('The satisfiable decision run did not produce an exact witness.')
        return { status: 'sat', witness: premises.witness }
      }
      if (compiled.counterexampleSmt === undefined) throw new Error('The entailment problem has no counterexample encoding.')
      changeStage('counterexample')
      // Deliver a queued cancellation (including a browser MutationObserver
      // reacting to the stage announcement) before starting native work. The
      // QF_NRA portfolio can visit more members after an interrupt. Avoid that
      // unnecessary work when cancellation is already queued at the boundary.
      await Promise.resolve()
      // This is already premises AND Boolean NOT(guarded conclusion). Adding
      // fresh definedness guards here would remove legitimate countermodels.
      const counterexample = await checkStage(compiled.counterexampleSmt, true, 'counterexample')
      const afterCounterexample = stoppedResult()
      if (afterCounterexample) return afterCounterexample
      if (counterexample.status === 'unknown' || counterexample.status === 'cancelled') return counterexample
      if (counterexample.status === 'unsat') return { status: 'entailed' }
      if (!counterexample.witness) throw new Error('The non-entailed decision run did not produce an exact countermodel.')
      return { status: 'not-entailed', witness: counterexample.witness }
    } catch (error) {
      return stoppedResult() ?? { status: 'error', stage, message: message_of(error) }
    } finally {
      if (timer !== undefined) clearTimeout(timer)
      clearInterruptRetry()
      activeOperation = undefined
      activeAttempt = undefined
      signal?.removeEventListener('abort', onAbort)
      this.running = false
    }
  }
}
