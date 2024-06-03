function callApi(path, httpMethod, jsonData="", responseHandler) {
    console.log("callApi: " + httpMethod + " " + path);  
    if (jsonData.length > 0) {
      console.log(jsonData);
      console.log("callApi:" + JSON.parse(jsonData));
    }
  
    axios({
      method: httpMethod,
      url: path,
      headers: {'Content-Type': 'application/json'},
      data: jsonData.length > 0 ? JSON.parse(jsonData) : {}
    })
    .then(function(response) { 
      console.log(response.data)
      console.log(response.status)
      if (responseHandler != undefined) {
        responseHandler(response);
      }
    })
    .then(function(error) { 
      if (error != undefined) {
        console.log(error)
      }
    });
  }

  function setupPopupWindow(windowId, openWindowButtonId, closeWindowId) {
    // Get the modal
    var modal = document.getElementById(windowId);
  
    // Get the button that opens the modal
    var openWindowButton = document.getElementById(openWindowButtonId);
  
    // Get the <span> element that closes the modal
    var closeWindowSpan = document.getElementById(closeWindowId);
  
    // When the user clicks on the button, open the modal
    openWindowButton.onclick = function() {
      modal.style.display = "block";
    }
  
    // When the user clicks on <span> (x), close the modal
    closeWindowSpan.onclick = function() {
      modal.style.display = "none";
    }
  
    dragElement(modal);
    return modal;
  }
  
  function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
      /* if present, the header is where you move the DIV from:*/
      document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;
    }
  
    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  
    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  
  function hide(divId) {
    var e = document.getElementById(divId);
    if (e === undefined || e == null) {
      console.log("hide(): could not find " + e);
      return;
    }
    e.style.display = "none";
  }
  function show(divId, display="block") {
    var e = document.getElementById(divId);
    if (e === undefined || e == null) {
      console.log("show(): could not find " + e);
      return;
    }
    e.style.display = display;
  }
  function getSelectedValue(selectElementId) {
    var value = null;
    var selectElement = document.getElementById(selectElementId);
    if (selectElement.options.length > 0) {
      value = selectElement.options[selectElement.selectedIndex].value;  
    }
    return value;
  }
  function getValue(elementId) {
    var e = document.getElementById(elementId);
    var value = e.value;
    return value;
  }
  function clearOptions(selectElement) {
    if (selectElement != undefined && selectElement.options != undefined && selectElement.options != null) {
      var i, L = selectElement.options.length - 1;
      for(i = L; i >= 0; i--) {
        selectElement.remove(i);
      }      
    }
  }
  function setInnerHtml(elementId, value) {
    var e = document.getElementById(elementId);
    if (e === undefined || e == null) {
      console.log("setInnerHtml(): could not find " + elementId);
      return;
    }
    e.innerHTML = value;
  }
  function getInnerHtmlValue(elementId) {
    var e = document.getElementById(elementId);
    if (e === undefined || e == null) {
      console.log("setInnerHtml(): could not find " + elementId);
      return null;
    }      
    return e.innerHTML;
  }
  
  function getSelectedRadioButton(elementName) {
    var choices = document.getElementsByName(elementName);
    var value = null;
    for (var i = 0; i < choices.length; i++){
        if (choices[i].checked) {
          value = choices[i].value;
        }
    }
    return value;
  }

  function createTable(rows, headings, backgroundColor=null) {
    var table = document.createElement('table');
    table.style.borderCollapse = "collapse";
    var tr = document.createElement('tr');
    if (backgroundColor != null) {
      tr.style.backgroundColor = backgroundColor;
    }
    for (var cell=0; cell < headings.length; cell++) {
      var th = document.createElement('th');
      th.style.align = "left";
      th.style.border = "1px solid black";
      var textNode = document.createTextNode(headings[cell]);
      th.appendChild(textNode);
      tr.appendChild(th);
    }
    table.appendChild(tr);   
    for (var r = 0; r < rows.length; r++) {
      tr = document.createElement('tr');
      tr.style.borderBottom = "1px solid black";
      if (backgroundColor != null) {
        tr.style.backgroundColor = backgroundColor;
      }
      var row = rows[r];
      for (var cell=0; cell < row.length; cell++) {
        var td = document.createElement('td');
        td.style.align = "left";
        td.style.border = "1px solid black";
        td.innerHTML = row[cell];
        //var textNode = document.createTextNode(row[cell]);
        //td.appendChild(textNode);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }
    return table;
  }
  
  function populateTable(rows, headings, backgroundColor=null) {
    document.getElementById("gameListData").innerHTML = "";
    var table = createTable(rows, headings, backgroundColor);
    document.getElementById("gameListData").appendChild(table);
  }

  function addSimpleOptions(select, options) {
    for (var i=0; i<options.length; i++) {
      var optionText = options[i];
      var option = document.createElement("option");
      option.innerText = optionText;
      option.value = optionText;
      select.append(option);
    }
  }

  