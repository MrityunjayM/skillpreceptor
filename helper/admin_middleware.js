const TransactionDetail = require("../models/transaction");
const Email = require("../models/newsLetter");
const PurchaseOfUser = require("../models/purchase_Schema");
const { transactionWeekFormat, timingFormat } = require("./date");

module.exports.getTodayRevenue = async () => {
  const dateNow = timingFormat(new Date());
  const transactionDetail = await TransactionDetail.find({
    date: dateNow.dateformattransaction,
  });
  return transactionDetail;
};

module.exports.getWeeklyRevenue = async () => {
  //below line will give us the date of now.
  const dateNow = timingFormat(new Date());
  // basically below line will give us the monday and sunday of this week.
  const dateformat = transactionWeekFormat();
  //then passsing it inside other function for getting exact date of monday.
  const storingPurposeData = timingFormat(dateformat[0]);
  // bellow function will give the date between two date.
  var getDaysArray = function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  };
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var daylist = getDaysArray(
    new Date(storingPurposeData.datePattern),
    new Date()
  );
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = daylist.map((e) => {
    return timingFormat(e).dateformattransaction;
  });
  // pushing last date inside newList.
  newList.push(dateNow.dateformattransaction);

  //finding TransactionDetail data with given date.
  const transactionDetail = await TransactionDetail.find({
    date: { $in: newList },
  });
  return transactionDetail;
};

module.exports.getMonthlyRevenue = async () => {
  const dateNow = timingFormat(new Date());
  const { month, year } = dateNow;
  const firstDayOfMonth = year + "-" + month + "-" + "01";
  // bellow function will give the date between two date.
  var getDaysArray = function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  };
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var dayList = getDaysArray(new Date(firstDayOfMonth), new Date());
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = dayList.map((e) => {
    return timingFormat(e).dateformattransaction;
  });
  // pushing last date inside newList(we have weekly data here).
  newList.push(dateNow.dateformattransaction);

  //finding TransactionDetail data with given date(we have monthly data here).
  const transactionDetail = await TransactionDetail.find({
    date: { $in: newList },
  });
  return transactionDetail;
};

module.exports.getMonthlySubscriber = async () => {
  const dateNow = timingFormat(new Date());
  const { month, year } = dateNow;
  const firstDayOfMonth = year + "-" + month + "-" + "01";
  var getDaysArray = function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  };
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var dayList = getDaysArray(new Date(firstDayOfMonth), new Date());
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = dayList.map((e) => {
    return timingFormat(e).dateformattransaction;
  });
  // pushing last date inside newList(we have weekly data here).
  newList.push(dateNow.dateformattransaction);
  // subscribed user this month.
  const subscribedUser = await Email.find({
    date: { $in: newList },
  }).sort({ createdAt: "-1" });
  return subscribedUser;
};

//this is for showing detail of data
module.exports.getMonthlyDetail = async () => {
  const dateNow = timingFormat(new Date());
  const { month, year } = dateNow;
  const firstDayOfMonth = year + "-" + month + "-" + "01";
  // bellow function will give the date between two date.
  var getDaysArray = function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  };
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var dayList = getDaysArray(new Date(firstDayOfMonth), new Date());
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = dayList.map((e) => {
    return timingFormat(e).dateformattransaction;
  });
  // pushing last date inside newList(we have weekly data here).
  newList.push(dateNow.dateformattransaction);

  //finding TransactionDetail data with given date(we have monthly data here).

  const transactionDetail = await PurchaseOfUser.find({
    date: { $in: newList },
  })
    .populate(["userId", "product"])
    .sort({ createdAt: "-1" });
  return transactionDetail;
};

module.exports.getWeeklyDetail = async () => {
  //below line will give us the date of now.
  const dateNow = timingFormat(new Date());
  // basically below line will give us the monday and sunday of this week.
  const dateformat = transactionWeekFormat();
  //then passsing it inside other function for getting exact date of monday.
  const storingPurposeData = timingFormat(dateformat[0]);
  // bellow function will give the date between two date.
  var getDaysArray = function (start, end) {
    for (
      var arr = [], dt = new Date(start);
      dt <= new Date(end);
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt));
    }
    return arr;
  };
  // here as a parameter i am passing the date in datePattern of timingFormat function
  var daylist = getDaysArray(
    new Date(storingPurposeData.datePattern),
    new Date()
  );
  // again passing the found date inside map function for getting the date like 10-03-2022.
  const newList = daylist.map((e) => {
    return timingFormat(e).dateformattransaction;
  });
  // pushing last date inside newList.
  newList.push(dateNow.dateformattransaction);
  //finding TransactionDetail data with given date.
  const transactionDetail = await PurchaseOfUser.find({
    date: { $in: newList },
  })
    .populate(["userId", "product"])
    .sort({ createdAt: "-1" });
  return transactionDetail;
};
