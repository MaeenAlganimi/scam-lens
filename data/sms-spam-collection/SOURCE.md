# SMS Spam Collection

The file `SMSSpamCollection` and the original `readme` in this folder are the SMS Spam Collection v.1, downloaded from the UCI Machine Learning Repository:

https://archive.ics.uci.edu/dataset/228/sms+spam+collection

DOI: https://doi.org/10.24432/C5CC84

UCI citation:

> Almeida, T. & Hidalgo, J. (2011). SMS Spam Collection [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5CC84.

Paper:

> Almeida, T.A., Gómez Hidalgo, J.M., Yamakami, A. Contributions to the Study of SMS Spam Filtering: New Collection and Results. Proceedings of the 2011 ACM Symposium on Document Engineering (DOCENG'11), Mountain View, CA, USA, 2011.

UCI states that the dataset is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). The collectors' original notice is preserved verbatim in `readme`. They hold the copyright and allow free use, with no warranty. Attribute the collection when you reuse it.

The collection is English. It has 5,574 lines (4,827 ham and 747 spam in the original readme's count). Scam Lens drops exact duplicate texts before the train/test split. The evaluation file records how many were removed.

Scam Lens does not ship the message text in the browser. Training happens at build time. The app only includes the resulting word counts.
