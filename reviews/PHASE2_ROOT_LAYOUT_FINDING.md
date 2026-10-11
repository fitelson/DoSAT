# Root finding while phase2 review is active

The production smoke on a390px viewport shows document horizontal overflow after
the Rule3 descendant-W example is checked. The mathematical outputs are correct
and no page errors occur. Likely causes: mobile1fr grid tracks impose SVG intrinsic
width, and native select padding expands beyond its max-width.

Proposed contained fix: mobile grid tracks minmax(0,1fr), diagram sections min-width0,
scroll containers max-width100%/border-box, and do-ui selects border-box. Keep
diagrams horizontally scrollable inside their containers. Verify all examples
and long labels in a browser. No source files changed while snapshot is frozen.
This finding needs resolution before phase2 closure; it is within the current
phase UI and is not an old-code audit.
