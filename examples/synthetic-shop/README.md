# Synthetic Northstar Shop

This example is entirely fictional. It demonstrates a two-repository release that reaches `released`, plus a verified Repair Case. Commit identifiers and pipeline anchors are inert examples and do not identify real systems.

From the repository root:

```sh
deliveryguard -C examples/synthetic-shop check
```

## Synthetic candidate review

The configured `reviews/hotfix.json` demonstrates a non-production bug fast path with fictional commits and evidence. Run `deliveryguard review validate reviews/hotfix.json --policy reviews/policy.json --json` from this example root. The existing released version fixture and this Hotfix are independent examples, not a claim that Hotfix approval released a version. See [review workflows](../../docs/review-workflows.md).
