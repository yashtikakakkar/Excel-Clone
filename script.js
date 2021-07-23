let rowNumberSection = document.querySelector(".row-number-section");

let formulaBarSelectedCellArea = document.querySelector(".selected-cell-div");

let cellSection = document.querySelector(".cell-section");
let columnTagsSection = document.querySelector(".column-tag-section");

let formulaInput = document.querySelector(".formula-input-section");

let lastCell; // the last cell where it had cell-selected property
let dataObj = {};

formulaInput.addEventListener("keydown", function (e) {
  if (e.key == "Enter") {
    console.log("now evaluating formula");

    let typedFormula = e.currentTarget.value;
    console.log(typedFormula);

    if (!lastCell) return;

    console.log("not returned");

    let selectedCellAdd = lastCell.getAttribute("data-address");
    let cellObj = dataObj[selectedCellAdd];

    cellObj.formula = typedFormula;

    let upstream = cellObj.upstream;

    for (let k = 0; k < upstream.length; k++) {
      removeFromDownstream(upstream[k], selectedCellAdd);
    }

    cellObj.upstream = [];

    let formulaArr = typedFormula.split(" ");
    let cellsInFormula = [];

    for (let i = 0; i < formulaArr.length; i++) {
      if (
        formulaArr[i] != "+" &&
        formulaArr[i] != "-" &&
        formulaArr[i] != "*" &&
        formulaArr[i] != "/" &&
        isNaN(formulaArr[i])
      ) {
        cellsInFormula.push(formulaArr[i]);
      }
    }

    for (let i = 0; i < cellsInFormula.length; i++) {
      addToDownstream(cellsInFormula[i], selectedCellAdd);
    }
    cellObj.upstream = cellsInFormula; //[A1, B1]

    let valObj = {};

    for (let i = 0; i < cellsInFormula.length; i++) {
      let cellValue = dataObj[cellsInFormula[i]].value;

      valObj[cellsInFormula[i]] = cellValue;
    }

    for (let key in valObj) {
      typedFormula = typedFormula.replace(key, valObj[key]);
    }

    let newValue = eval(typedFormula);

    lastCell.innerText = newValue;

    cellObj.value = newValue;

    let downstream = cellObj.downstream;

    for (let i = 0; i < downstream.length; i++) {
      updateCell(downstream[i]);
    }

    dataObj[selectedCellAdd] = cellObj;

    formulaInput.value = "";
  }
});

// to make the column and row section scroll w the cells
cellSection.addEventListener("scroll", function (e) {
  // scrollTop -> gets amt of pixels that we have scrolled vertically; lower scroll -> higher value; higher scroll -> lower value
  rowNumberSection.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`; // for translateY -> down scroll means negative value

  // scrollLeft -> gets amt of pixels that we have scrolled horizontally; right scroll -> higher value; left scroll -> lower value
  columnTagsSection.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`; // for translateX -> left scroll means negative value
});

// add 100 rows
for (let i = 1; i <= 100; i++) {
  // 0th row isn't visible
  let div = document.createElement("div");
  div.innerText = i;
  div.classList.add("row-number");
  rowNumberSection.append(div);
}

// add 26 columns (alphabetized)
for (let i = 0; i < 26; i++) {
  let asciiCode = 65 + i; // for i=0, ascii=65
  let reqAlphabet = String.fromCharCode(asciiCode); // converting 65 to 'A' ans so on

  let div = document.createElement("div");
  div.innerText = reqAlphabet;
  div.classList.add("column-tag");
  columnTagsSection.append(div);
}

// inside this nested for loop we are creating individual cells UI + cell obj
for (let i = 1; i <= 100; i++) {
  let rowDiv = document.createElement("div");
  rowDiv.classList.add("row");
  //i = 1 [A1,B1..........Z1]
  //i = 2 []
  //.
  //.
  //i = 100 [A100.........z100]

  for (let j = 0; j < 26; j++) {
    //i = 100   j = 25  asciiCode = 65+25=90  alpha = z  cellAdd = Z100
    // A to Z
    let asciiCode = 65 + j;

    let reqAlphabet = String.fromCharCode(asciiCode);

    let cellAddress = reqAlphabet + i;

    dataObj[cellAddress] = {
      value: undefined,
      formula: undefined,
      upstream: [],
      downstream: [],
      align: "left",
      color: "black",
      bgColor: "white",
    };

    let cellDiv = document.createElement("div");

    cellDiv.addEventListener("input", function (e) {
      let currCellAddress = e.currentTarget.getAttribute("data-address");

      let currCellObj = dataObj[currCellAddress];

      currCellObj.value = e.currentTarget.innerText;

      currCellObj.formula = undefined;

      //1- loop on upstream
      let currUpstream = currCellObj.upstream;
      for (let k = 0; k < currUpstream.length; k++) {
        //2- for each cel go to its downstream and remove self
        removeFromDownstream(currUpstream[k], currCellAddress);
      }

      //3- update self upstream to an empty array, because no formula toh no dependancy
      currCellObj.upstream = [];

      let currDownstream = currCellObj.downstream;

      // C1(20) => [E1]  E1 (2*C1) [40]

      for (let i = 0; i < currDownstream.length; i++) {
        updateCell(currDownstream[i]);
      }

      dataObj[currCellAddress] = currCellObj;

      console.log(dataObj);
    });

    cellDiv.classList.add("cell");

    cellDiv.setAttribute("data-address", cellAddress);

    cellDiv.setAttribute("contenteditable", true);

    // if a cell is clicked, we need to select it (highlight the border) and display its data address in "selected cell" box in the formula bar
    cellDiv.addEventListener("click", function (e) {
      // if another cell is already selected, then that cell would be here (line 83), remove the selected class from this
      if (lastCell) {
        lastCell.classList.remove("cell-selected");
      }

      // add the selected class to this clicked cell
      e.currentTarget.classList.add("cell-selected");

      // set this cell as the lastCell
      lastCell = e.currentTarget;

      // store the dataAddress of the current cell
      let currCellAddress = e.currentTarget.getAttribute("data-address");

      // set this address in the "selected cell" box in the formula bar
      formulaBarSelectedCellArea.innerText = currCellAddress;
    });

    // add cells in the row
    rowDiv.append(cellDiv);
  }

  // add rows in the cellSection
  cellSection.append(rowDiv);
}


if (localStorage.getItem("sheet")) {
  console.log(1);
  dataObj = JSON.parse(localStorage.getItem("sheet"));

  for (let x in dataObj) {
    let cell = document.querySelector(`[data-address='${x}']`);
    if (dataObj[x].value) cell.innerText = dataObj[x].value;
    // dataObj[x]
  }
}


// C1 = Formula(2*A1)
// A1 = parent
// C1 = child

//is function kisi ki upstream se mtlb nhi hai
//iska bs itna kaam h ki parent do and child do, aur mai parent ki downstream se child ko hta dunga
//taki unke beech ka connection khtm hojaye
//taki agr parent update ho to connection khtm hone ke baad child update na ho
function removeFromDownstream(parentCell, childCell) {
  //1- fetch parentCell's downstream

  let parentDownstream = dataObj[parentCell].downstream;

  //2- filter kro childCell ko parent ki downstream se

  let filteredDownstream = []; //A1

  for (let i = 0; i < parentDownstream.length; i++) {
    if (parentDownstream[i] != childCell) {
      //check if not equal to C1, add in filtered array
      filteredDownstream.push(parentDownstream[i]);
    }
  }

  //3- filtered upstream will now be saved in dataObj's req cell
  dataObj[parentCell].downstream = filteredDownstream;
}

function updateCell(cell) {
  let cellObj = dataObj[cell];
  let upstream = cellObj.upstream; // [(A1-20), B1-10]
  let formula = cellObj.formula; // A1 + B1

  // upstream me jo bhi cell hai unke objects me jaunga wahan se unki value lekar
  // wo sari values mai ek object me key value pair form me store krunga where key being the cell address

  // {
  //   A1:20,
  //   B1:10
  // }

  let valObj = {};

  for (let i = 0; i < upstream.length; i++) {
    let cellValue = dataObj[upstream[i]].value;

    valObj[upstream[i]] = cellValue;
  }

  //a1 + b1

  for (let key in valObj) {
    formula = formula.replace(key, valObj[key]);
  }

  //20 + 10

  // will evaluate 20+10 as 30
  let newValue = eval(formula);

  let cellOnUi = document.querySelector(`[data-address='${cell}']`);
  cellOnUi.innerText = newValue;

  dataObj[cell].value = newValue;

  let downstream = cellObj.downstream;

  for (let i = 0; i < downstream.length; i++) {
    updateCell(downstream[i]);
  }
}

function addToDownstream(parent, child) {
  // child ko parent ki downstream me add krna hai
  dataObj[parent].downstream.push(child);
}

