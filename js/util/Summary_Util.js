function showSummary(id, countGoodDays, countBadDays, iterations, elementToUse = null) {
    var summary_elem = document.getElementById(id);
    var summary_text = elementToUse ? elementToUse : document.createElement("p");
    let badDays_plural = countBadDays == 1 ? "" : "s";
    let goodDays_plural = countGoodDays == 1 ? "" : "s";
    summary_text.innerText = countGoodDays + ` good day${goodDays_plural} and ` + countBadDays + ` bad day${badDays_plural} out of ` + iterations + " days watched (" + Number.parseInt(countGoodDays/iterations*100) + "%).";
    summary_elem.append(summary_text);
}

function addValue(elementName, className, value, row) {
    var elem = document.createElement(elementName)
    elem.setAttribute("class", className);
    elem.append(value);
    row.append(elem);
    return elem;
}

export {showSummary, addValue};
