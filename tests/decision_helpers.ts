import { expect, type Page } from "@playwright/test"
import { savedDecisionFixture } from "./fixtures/decision_problems"

export const loadDecisionFixture = async (page: Page, index: number): Promise<void> => {
  const value = savedDecisionFixture(index)
  await page.getByLabel("Load saved decision problem").setInputFiles({ name: "regression.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(value)) })
  await expect(page.getByTestId("decision-graph")).toHaveValue(value.graph)
  await expect(page.getByTestId("decision-conclusion")).toHaveValue(value.conclusion)
  await expect(page.getByTestId("decision-example")).toHaveValue("")
}
