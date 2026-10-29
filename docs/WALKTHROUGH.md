# Scam Lens in an interview

Scam Lens is a static Next.js page. A person pastes a message, or uploads a screenshot, and the page explains a scam-risk score. English, Arabic, and Spanish are all real paths: the interface is translated, Arabic is right to left, and each language has its own phrases.

Nothing in the score needs a server. That is the product constraint and the thing worth being able to draw on a whiteboard.

## Architecture

The screen calls one function, `analyzeMessage`. That function asks three modules for findings and adds the points.

1. The rule engine folds the text and looks for phrases. Folding covers case, Spanish accents, and Arabic diacritics. The highlight indexes point back at the original letters, so the user sees their own text.
2. The link analyser pulls out raw URLs, bare domains, HTML links, and Markdown links. It parses each URL, decodes punycode, and compares the host with a list of real brand domains.
3. A naive Bayes model, stored as word counts in `model.json`, returns a spam probability. Training happens in `scripts/train.ts` before the app is built. The browser only does the arithmetic.

The UI is a client component. The classifier, the lists, and the copy are plain TypeScript, which is why the tests do not need a browser except for the component test.

Screenshot text uses tesseract.js. The npm package is the API. The worker, the WebAssembly core, and the language data are loaded from pinned jsDelivr URLs. The image never goes to an application server. The CDN sees a request for the engine files.

## Decisions

**A sum, not a black box.** Rules, links, and the model each add points, and the score stops at 100. A password request is 36. A lookalike host is 30. The model can add at most 20. Someone can recompute a score from the list on screen. The cost is that the parts are not independent: the word "password" can count in the rules and in the model.

**Naive Bayes, boolean.** Each kept word votes once per message. The stored number is how many training messages of that class contained it, with add-one smoothing. It is weak next to a transformer and strong enough to explain. Counts stay integers, so the committed model can be compared exactly in a test.

**Chi-square, plus a language quota.** The public set is English and much larger. A single top-1,500 list would drop Arabic and Spanish. The trainer keeps those 1,500 and also the top 150 words from each of the Arabic and Spanish training rows. A word has to appear in at least two training messages.

**Dedupe before the split.** The SMS collection has 5,574 lines and 403 exact duplicate texts. Leaving them in would let the same message sit in train and test. They are removed first. The split is stratified by language and label with seed 42, and about 20% is held out. The test suite retrains and checks the committed files, so the README cannot drift from the code.

**Official domains are not suspicious.** `https://www.paypal.com/...` adds no link points. `paypal-secure.xyz` does, because the registrable domain is not PayPal's. A subdomain of a real brand is treated as that brand. A different brand named in another label still counts, so `paypal.example.com` is not "fine" just because some other company is official.

**OCR from a pinned CDN.** Shipping every Tesseract language file inside the repo would make the download large. Pinning `tesseract.js@5.1.1` and the `4.0.0_best_int` language data makes the network request obvious and versioned. `langPath` stays empty because each language lives in its own package.

## Trade-offs

- Phrase lists are easy to audit and easy to evade. The model catches some wording the list misses, mostly English promotional SMS, and it will miss a careful spear-phish.
- Stacking points can push a message to 100 quickly. The cap is there so the number stays in range, and the UI says when the raw total was higher.
- The handwritten Arabic and Spanish set is original and small. It teaches the model a few words and gives the rules something to hit. It is not a public benchmark. The UCI holdout is the number to trust.
- There is no live domain reputation and no sender identity. Adding either would mean sending the message, or the URL, off the device.
- A strict content-security policy would fight the OCR worker. The static host sets framing and referrer headers instead.

## Measured results

These are copied from the training run. UCI holdout messages: 1035. Shipped model: accuracy 0.9807, precision 0.9237, recall 0.9237, F1 0.9237. UCI-only baseline F1 0.9242, precision 0.9173, recall 0.9313. Handwritten holdout (24 messages): accuracy 0.9583, precision 1.0000, recall 0.9167, F1 0.9565. Per language, on 8 messages: English accuracy 0.8750, precision 1.0000, recall 0.7500, F1 0.8571. Arabic and Spanish are accuracy, precision, recall, and F1 1.0000. The perfect Arabic and Spanish figures are not a language benchmark. The table with the confusion counts is in the README.

## Questions you will get

**Why not send the text to a language model?**
The point of the project is that the message stays on the device, and that every point can be named. A remote model would be harder to explain and would break the privacy claim.

**Why is the English accuracy so high?**
The SMS collection is a well-worn benchmark, promotional spam is repetitive, and a boolean bag of words is a classic fit for it. Ten false positives and ten false negatives on 1,035 holdout messages is the actual result, not a claim that phishing is solved. The UCI-only F1 is 0.9242. The shipped model, which also saw the handwritten rows, is 0.9237 on the same holdout. The extra data did not help the English benchmark.

**What stops the test set leaking into the model?**
Duplicates are removed, then the split is done, then chi-square and the counts use the training rows only. The holdout is used when the metrics are computed. The demo sentences are not in the training file.

**How does Arabic work if the public data is English?**
The phrase list is hand-written in Arabic, and the trainer reserves Arabic words so they are not crowded out. Detection does not depend on the UI language: an Arabic message is checked even if the buttons are in English. Layout is separate. The page sets `dir="rtl"` for the chrome, and the message itself uses `dir="auto"` so a pasted English SMS still reads left to right.

**How would you break it?**
Rephrase the ask so it misses the list, use a fresh domain that does not resemble a known brand, or put the real request in an image that OCR mangles. A shortener with no other signal is only 18 points, which is still the low band until something else stacks.

**What would you add next?**
More held-out messages that do not share the rule phrases, a fuller public-suffix list, and a way to show which training words pushed the probability up. I would not add a network call for the message.

## Licence, in one breath

The application code is MIT, copyright Maeen Alganimi. The SMS Spam Collection is included under CC BY 4.0 as stated by UCI, with the collectors' original notice kept beside the file. tesseract.js is Apache-2.0 and is a dependency, not copied source.
