var DateIterator = (function DateIterator() {
  function padWithZeros(num) {
    num = num + "";
    return (num.length < 2 ? "0" : "") + num;
  }

  function formatDate(date) {
    return date.getFullYear() + "-" +
      padWithZeros(date.getUTCMonth() + 1) + "-" +
      padWithZeros(date.getUTCDate()) +
      "T" +
      padWithZeros(date.getUTCHours()) + ":" +
      padWithZeros(date.getUTCMinutes()) + ":" +
      padWithZeros(date.getUTCSeconds());
  }

  function create(startDate, interval, steps, format) {
    if (
      startDate === undefined ||
      interval === undefined ||
      steps === undefined
    ) {
      throw "[DateIterator::create] - Illegal parameters, EVERY date parameters must be set!";
    }
    (typeof format !== "function") && (format = function (a) {
      return a;
    });
    startDate = new Date(startDate);
    if (startDate.getTime() === "Invalide Date") {
      throw "[DateIterator::create] - Invalid startDate";
    }
    interval = interval * 60 * 1000;

    var i = 0;

    function iterate(reset) {
      if (!reset) {
        if (i < steps) {
          var start = new Date(startDate.getTime() + i * interval);
            end = new Date(start.getTime() + interval);

          i += 1;
          return format({
            "start": formatDate(start),
            "end": formatDate(end)
          });
        }
        i = 0;
        return;
      }
    }

    function iterateAll() {
      var dates = [], date;

      for (date = iterate(); date; date = iterate()) {
        dates.push(date);
      }
      return dates;
    };

    iterate.all = iterateAll;
    return iterate;
  }

  return {
    "create": create
  };
}());

if (typeof module !== 'undefined') {
  module.exports = DateIterator;
}