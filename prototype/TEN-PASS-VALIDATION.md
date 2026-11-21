# Ten build-and-test passes — November 20, 2026

The requested ten passes are complete in local release 0.12.4. They changed source import and local revision review only. No live lesson save, staging, cleanup, source edit, or permission change occurred.

| Pass | Improvement | Validation |
| --- | --- | --- |
| 1 | Reject partial saved reports before missing fields can become deletions | Missing overviews, vocabulary, associations and invalid identities rejected |
| 2 | Preserve unchanged resource provenance | Extra local resource metadata and approval retained |
| 3 | Preserve moved section provenance | Cross-activity move retains section identity, callouts and source notes |
| 4 | Bind retained level metadata to native identity | Assessment edits retain metadata; same-name replacements do not |
| 5 | Protect edits during asynchronous report reads | Both reading and verification race windows tested |
| 6 | Import complete Notion columns and rich text | Nested content, emphasis, escaped labels and complete links tested |
| 7 | Retain nested brief headings | Teaching subsections retained; unrelated peer headings reported |
| 8 | Validate Slides identities and note text | Missing/duplicate identities and ambiguous/malformed notes rejected |
| 9 | Validate PowerPoint archive consistency | Header mismatches and duplicate ignored-media entries rejected |
| 10 | Validate the real source exports and saved receipt | Native null titles/remarks and numeric-string IDs supported; full suite and browser check |

Final regression: 241 tests passed, zero failures. Command: `node --test --test-isolation=none --test-reporter=spec` from prototype.

Real input checks: 15 slides, 14 with speaker notes, three brief objectives and three resources. Both files imported together in an isolated local browser workspace with no console errors. Identity-change warnings remain deliberate: the importer does not guess level mappings for a deck with different identities.

The retained successful companion receipt was independently reverified offline. Its saved lesson contains all four original levels, three assessment flags and ten teaching sections. This recheck made zero remote requests and does not claim a fresh live read. Earlier installed 0.12.3 evidence establishes the unchanged native save workflow; 0.12.4 does not change that save path. The installed extension was not reloaded for these local changes.

Remaining scope: standalone Notion OAuth, general publishing/shared collection mutations, independent cross-curriculum acceptance and live receipt-owned cleanup remain unimplemented or unaccepted as previously documented. Notion Markdown/complete-block exports and signed-in Slides export are supported. Do not change the accepted live lesson to pursue broader acceptance.
