// ==UserScript==
// @name         Msho
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  decoration
// @author       You
// @match        https://supplier.meesho.com/panel/msm2w/orders
// @icon         https://www.google.com/s2/favicons?sz=64&domain=meesho.com
// @require      http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/tnj-biz/tnj-carnival/blob/main/msho-tampermonkey.js?raw=1
// @updateURL    https://github.com/tnj-biz/tnj-carnival/blob/main/msho-tampermonkey.js?raw=1
// ==/UserScript==
$(document).ready(function () {

    var actualHost = window.location.toString();
    var skuCount = new Map();
    var total = 0;

    setTimeout(function() {
        var lastScrollHeight = 0;
        var scrollDown = window.setInterval(autoScroll, 1000);
        function autoScroll() {
            var sh = document.documentElement.scrollHeight;
            console.log("Height" + sh);
            if (sh != lastScrollHeight) {
                lastScrollHeight = sh;
                window.scrollTo(0, sh);
                document.documentElement.scrollTop = sh;
            } else {
                clearInterval(scrollDown);
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;

                var boxes = document.getElementsByClassName("group-suborders");
                console.log("Imran " + boxes.length);

                if(actualHost == "https://supplier.meesho.com/panel/msm2w/orders#pending") {
                    // Pending calculation logic : order -> select div with .order-product-size -> div .product-sku text-ellipsis display-block but not .product-id -> 2nd span's inner HTML
                    var orderInfo = document.getElementsByClassName("order-product-info") // Will pending + cancelled + shipped
                    var skuCountPending = {};
                    var totalPending = 0;
                    for (order of orderInfo) {
                        if(order.children.length == 4) {
                            //Filtered items for pending as it has 4 childs, 2 extra for SLA status as compared to shipped and cancelled
                            var sku = order.querySelector(".order-product-size").querySelectorAll(".product-sku.text-ellipsis:not(.product-id)")[0].getElementsByTagName("span")[1];

                            if(sku != undefined ){
                                var idPost=sku.innerHTML;

                                if(skuCountPending[idPost] == undefined) {
                                    skuCountPending[idPost] = 1;
                                } else {
                                    skuCountPending[idPost] = skuCountPending[idPost] + 1;
                                }
                                totalPending++;
                            }
                        }
                    }
                    console.log("Pending count : " + totalPending);
                    console.log("Pending SKU Counts : " + JSON.stringify(skuCountPending))
                    console.log("host" + actualHost);

                    createSummaryTable($(".filter-container"), skuCountPending, totalPending);
                    createOrderTimeSummary();
                    
                } else if (actualHost == 'https://supplier.meesho.com/panel/msm2w/orders#readytoship') {
                    // ReadyToShip calculation logic : sel div with .order-product relative  checkbox-present -> with 4 children -> .order-product-size -> div .product-sku text-ellipsis display-block but not .product-id -> 2nd span's inner

                    var orderInfo = document.getElementsByClassName("order-product relative  checkbox-present");
                    var skuCountReadyToShip = {};
                    var totalReadyToShip = 0;

                    for (var order of orderInfo) {
                        if(order.children.length == 4) {
                            //filter items for ready to ship
                            var sku = order.querySelector(".order-product-size").querySelectorAll(".product-sku.text-ellipsis:not(.product-id)")[0].getElementsByTagName("span")[1];

                            if(sku != undefined ){
                                 var idPost=sku.innerHTML;
                                 if(skuCountReadyToShip[idPost] == undefined) {
                                     skuCountReadyToShip[idPost] = 1;
                                 } else {
                                     skuCountReadyToShip[idPost] = skuCountReadyToShip[idPost] + 1;
                                 }
                                 totalReadyToShip++;
                        }
                        }


                    }
                    console.log("ReadyToShip count : " + totalReadyToShip);
                    console.log("ReadyToShip SKU Counts : " + JSON.stringify(skuCountReadyToShip))
                    console.log("host" + actualHost);

                    createSummaryTable($(".filter-container"), skuCountReadyToShip, totalReadyToShip);
                    createOrderTimeSummary();
                }
                
            }
        }
    }, 1000);

    function createSummaryTable(element ,skuCount, total) {
        var stdSkuCount = dedupeSkuCount(skuCount);
        element.append("<h3>Summary</h3></br>");


        // creating table elements
        var table = document.createElement('table');
        // creating table body <tbody> element
        var tableBody = document.createElement('tbody');

        var row = document.createElement('tr');
        var cellh = document.createElement('th');

        cellh.style.color = "blue";
        cellh.style.border = "1px solid grey";
        cellh.style.textalign = "centre"
        cellh.style.padding = "8px"

        var cellh1 = cellh.cloneNode(true);
        var cellh2 = cellh.cloneNode(true);

        cellh1.appendChild(document.createTextNode("SKU"));
        row.appendChild(cellh1);
        cellh2.appendChild(document.createTextNode("Count"));
        row.appendChild(cellh2);

        tableBody.appendChild(row)


        for (sku in stdSkuCount) {
            var row = document.createElement('tr');
            var cell = document.createElement('td');

            cell.style.color = "navy-";
            cell.style.border = "1px solid grey";
            cell.style.textalign = "centre"
            cell.style.padding = "8px"


            var cell2 = cell.cloneNode(true);

            // adding array item to it's cell
            cell.appendChild(document.createTextNode(sku));
            row.appendChild(cell);
            cell2.appendChild(document.createTextNode(stdSkuCount[sku]));
            row.appendChild(cell2);
            tableBody.appendChild(row);
        }
        table.appendChild(tableBody);
        table.style.border = 'solid 1px black';
        table.style.fontfamily = 'arial, sans-serif';
        sortTable(table, 1);
        element.append(table);
        element.append("<h4>Total : " + total + "</h4>");
    }

    function dedupeSkuCount(skuCount) {
        var skuCountOutput = {}
        var variantToStdSKU = {
            "F0007" : "F7",
            "4zBTY3Yk" : "F6",
            "F0006" : "F6",
            "FJ006" : "F6",
            "F0015" : "F15",
            "F0001" : "F1",
            "F0002" : "F2",
            "F0004" : "F4",
            "FJ002" : "F2",
            "FJ026-" : "F26",
            "F0018" : "F18",
            "F0033" : "F33",
            "FJ030" : "F30",
            "FJ031" : "F31",
            "F0031" : "F31",
            "F0032" : "F32",

         };

        for (sku in skuCount) {
           var stdSku = variantToStdSKU[sku];

           if(stdSku == undefined) {
              stdSku = sku;
           }

           if (skuCountOutput[stdSku] == undefined) {
               skuCountOutput[stdSku] = 0 + skuCount[sku];
           } else {
               skuCountOutput[stdSku] = skuCountOutput[stdSku] + skuCount[sku];
           }
        }

        return skuCountOutput;
    }

    function sortTable(table, filterColIndex) {
        var rows, switching, i, x, y, shouldSwitch;
        switching = true;
        /*Make a loop that will continue until  no switching has been done:*/
        while (switching) {
            //start by saying: no switching is done:
            switching = false;
            rows = table.rows;
            /*Loop through all table rows (except the    first, which contains table headers):*/
            for (i = 1; i < (rows.length - 1); i++) {
                //start by saying there should be no switching:
                shouldSwitch = false;
                /*Get the two elements you want to compare,      one from current row and one from the next:*/
                x = rows[i].getElementsByTagName("TD")[filterColIndex];
                y = rows[i + 1].getElementsByTagName("TD")[filterColIndex];
                //check if the two rows should switch place:
                if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
                    //if so, mark as a switch and break the loop:
                    shouldSwitch = true;
                    break;
                }
            }
            if (shouldSwitch) {
                /*If a switch has been marked, make the switch and mark that a switch has been done:*/
                rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                switching = true;
            }
        }
    }

    function createOrderTimeSummary() {
       var orderHeadings = document.getElementsByClassName("order-view-heading order-price-info");
        console.log("hololol");
        console.log(orderHeadings[0].getElementsByTagName("TD")[1].innerHTML.split(",")[0]);
        console.log(orderHeadings[0].getElementsByTagName("TD")[1].innerHTML.split(",")[1]);

        var dateTimeCatToOrderCount = {};
        var dateToOrderCount = {};
        for(orderHeading of orderHeadings) {
            var dateTime = orderHeading.getElementsByTagName("TD")[1].innerHTML.split(",");
            var date = dateTime[0];

            var time = dateTime[1].trim();

            var key = null;
            var hr = parseInt(time.split(":")[0]);
            var ampm = time.split(" ")[1];
            if(ampm == "AM") {
               if(hr >= 6) {
                   key = date + "-(06-12hr)";
               } else {
                   key = date + "-(00_06hr)";
               }
            } else {
               if(hr >= 6) {
                   key = date + "-(18_24hr)";
               } else {
                   key = date + "-(12_18hr)";
               }
            }

            var presentCount = dateTimeCatToOrderCount[key];
            if(presentCount == null) {
                dateTimeCatToOrderCount[key] = 1;
            } else {
                dateTimeCatToOrderCount[key] = presentCount + 1;
            }

            var presentOrderCount = dateToOrderCount[date];
            if(presentOrderCount == null) {
                dateToOrderCount[date] = 1;
            } else {
                dateToOrderCount[date] = presentOrderCount + 1;
            }

        }
        console.log(dateTimeCatToOrderCount);
        console.log(dateToOrderCount);

        var dateKeyToPerc = {};
        for (const [key, value] of Object.entries(dateTimeCatToOrderCount)) {
            var totalDateOrders = dateToOrderCount[key.split("-")[0]];
            dateKeyToPerc[key] = Math.round((value*100)/totalDateOrders) + '%';
        }

        console.log(dateKeyToPerc);
        createOrderByTimeTable($(".filter-container"), dateKeyToPerc, dateTimeCatToOrderCount);
    }

    function createOrderByTimeTable(element ,dateKeyToPerc, dateTimeCatToOrderCount) {
        element.append("<h3>When do we get order in the day ?</h3></br>");


        // creating table elements
        var table = document.createElement('table');
        // creating table body <tbody> element
        var tableBody = document.createElement('tbody');

        var row = document.createElement('tr');
        var cellh = document.createElement('th');

        cellh.style.color = "blue";
        cellh.style.border = "1px solid grey";
        cellh.style.textalign = "centre"
        cellh.style.padding = "8px"

        var cellh1 = cellh.cloneNode(true);
        var cellh2 = cellh.cloneNode(true);
        var cellh3 = cellh.cloneNode(true);

        cellh1.appendChild(document.createTextNode("Day (Time)"));
        row.appendChild(cellh1);
        cellh2.appendChild(document.createTextNode("Order Count"));
        row.appendChild(cellh2);
        cellh3.appendChild(document.createTextNode("Perc of day's order"));
        row.appendChild(cellh3);

        tableBody.appendChild(row)

        for (const [key, value] of Object.entries(dateTimeCatToOrderCount)) {
            var row = document.createElement('tr');
            var cell = document.createElement('td');

            cell.style.color = "navy-";
            cell.style.border = "1px solid grey";
            cell.style.textalign = "centre"
            cell.style.padding = "8px"


            var cell2 = cell.cloneNode(true);
            var cell3 = cell.cloneNode(true);

            // adding array item to it's cell
            cell.appendChild(document.createTextNode(key));
            row.appendChild(cell);
            cell2.appendChild(document.createTextNode(value));
            row.appendChild(cell2);
            cell3.appendChild(document.createTextNode(dateKeyToPerc[key]));
            row.appendChild(cell3);
            tableBody.appendChild(row);
        }

        table.appendChild(tableBody);
        table.style.border = 'solid 1px black';
        table.style.fontfamily = 'arial, sans-serif';
        sortTable(table, 0);
        element.append(table);
    }

});
