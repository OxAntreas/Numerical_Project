let current = "";

const config = {
    "Bisection": ["func", "xl", "xu", "epsilon", "iter"],
    "False Position": ["func", "xl", "xu", "epsilon", "iter"],
    "Fixed Point": ["func", "x0", "epsilon", "iter"],
    "Simple Fixed Point": ["func", "x0", "epsilon", "iter"],
    "Newton": ["func", "x0", "epsilon", "iter"],
    "Secant": ["func", "x-1", "x0", "epsilon", "iter"],
    "Gauss Elimination": ["equations"],
    "Gauss Jordan": ["equations"],
    "LU": ["equations"],
    "Cramer Rule": ["equations"],
    "Interpolation": ["points", "x"],
    "Trapezoidal": ["func", "a", "b", "n"],
    "Simpson": ["func", "a", "b", "n"]
};

function selectAlgorithm(name) {
    current = name;
    document.getElementById("title").innerText = name;
    buildInputs(name);
}

function buildInputs(method) {
    let div = document.getElementById("inputs");
    div.innerHTML = "";
    
    const rootMethods = ["Bisection", "False Position", "Fixed Point", "Newton", "Secant", "Simple Fixed Point"];
    
    if (rootMethods.includes(method)) {
        let criterionGroup = document.createElement("div");
        criterionGroup.className = "input-group";
        criterionGroup.innerHTML = `
            <label>STOP CONDITION</label>
            <select id="stop_criterion" onchange="toggleStopInputs()">
                <option value="error">Relative Error (%)</option>
                <option value="iter">Iteration Count</option>
            </select>
        `;
        div.appendChild(criterionGroup);
    }

    config[method].forEach(field => {
        let group = document.createElement("div");
        group.className = "input-group";
        group.id = `group-${field}`;
        
        let inputHtml = "";
        if (field === "equations") {
            inputHtml = `
                <div class="system-size-group">
                    <label>System Size</label>
                    <div class="select-wrapper">
                        <select id="system-size" onchange="renderEquationInputs(parseInt(this.value))">
                            <option value="2">2 x 2</option>
                            <option value="3" selected>3 x 3</option>
                            <option value="4">4 x 4</option>
                            <option value="5">5 x 5</option>
                        </select>
                    </div>
                </div>
                <div id="equations-container">
                    <!-- Default 3 inputs will be generated here -->
                </div>
            `;
        } else {
            inputHtml = `<input id="${field}" placeholder="Enter ${field}" onkeydown="if(event.key==='Enter') solve()">`;
        }

        group.innerHTML = `
            <label>${field.toUpperCase()}</label>
            ${inputHtml}
        `;
        div.appendChild(group);
    });

    if (rootMethods.includes(method)) {
        toggleStopInputs();
    }
    
    // Initialize equations if present
    if (config[method].includes("equations")) {
        renderEquationInputs(3); // Default size
    }
}

function toggleStopInputs() {
    let criterion = document.getElementById("stop_criterion").value;
    let epsGroup = document.getElementById("group-epsilon");
    let iterGroup = document.getElementById("group-iter");

    if (criterion === "error") {
        epsGroup.style.display = "block";
        iterGroup.style.display = "none";
    } else {
        epsGroup.style.display = "none";
        iterGroup.style.display = "block";
    }
}

async function solve() {
    if (!current) return alert("Please select a method!");

    let data = { method: current };
    config[current].forEach(field => {
        if (field === "equations") {
            let eqInputs = document.querySelectorAll('.eq-input');
            let eqs = [];
            eqInputs.forEach(input => {
                if(input.value.trim() !== '') eqs.push(input.value.trim());
            });
            data[field] = eqs.join('\n');
        } else {
            data[field] = document.getElementById(field).value;
        }
    });

    // Add stop criterion if it exists
    let stopCrit = document.getElementById("stop_criterion");
    if (stopCrit) {
        data["stop_criterion"] = stopCrit.value;
    }

    try {
        let res = await fetch('/solve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        let result = await res.json();

        if (typeof result === "string") {
            document.getElementById("result").innerHTML = `<div style="color:#ef4444; padding:20px; font-weight:bold;">${result}</div>`;
        } else {
            if (result.type === "steps") {
                renderSteps(result.steps);
            } else if (result.root !== undefined && result.iterations !== undefined) {
                renderResult(result);
            } else {
                renderTable(result, null);
            }
        }
    } catch (err) {
        document.getElementById("result").innerHTML = "Connection Error";
    }
}

function renderResult(data) {
    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    let tableDiv = document.createElement("div");
    tableDiv.id = "table-container";
    resultDiv.appendChild(tableDiv);
    renderTable(data.iterations, "table-container");

    let rootCard = document.createElement("div");
    rootCard.className = "root-card";
    rootCard.innerHTML = `
        <div class="root-label">FINAL ROOT</div>
        <div class="root-value">${data.root}</div>
    `;
    resultDiv.appendChild(rootCard);
}

function renderTable(data, targetId) {
    if (!data || data.length === 0) return;

    const columnsConfig = {
        "Bisection": ["iteration", "xl", "f(xl)", "xu", "f(xu)", "xr", "f(xr)", "error"],
        "False Position": ["iteration", "xl", "f(xl)", "xu", "f(xu)", "xr", "f(xr)", "error"],
        "Fixed Point": ["iteration", "xl", "f(xl)", "xr", "f(xr)", "error"],
        "Newton": ["iteration", "xi", "f(xi)", "f'(xi)", "error"],
        "Secant": ["iteration", "xl", "f(xl)", "xu", "f(xu)", "xr", "f(xr)", "error"],
        "Simple Fixed Point": ["iteration", "xi", "g(xi)", "error"],
        "Gaussian": ["iteration", "xr"]
    };

    let cols = columnsConfig[current] || ["iteration", "xr", "error"];

    let html = `<table><thead><tr>`;
    cols.forEach(col => {
        let label = col === "xr" && current === "Gaussian" ? "VALUE" : 
                    col === "iteration" && current === "Gaussian" ? "VARIABLE" : col.toUpperCase();
        html += `<th>${label}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    data.forEach(row => {
        html += `<tr>`;
        cols.forEach(col => {
            html += `<td>${row[col] !== undefined ? row[col] : "-"}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    
    if (targetId) {
        document.getElementById(targetId).innerHTML = html;
    } else {
        document.getElementById("result").innerHTML = html;
    }
}

function renderSteps(steps) {
    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";
    
    steps.forEach((step, idx) => {
        let stepEl = document.createElement("div");
        stepEl.className = "step-container";
        stepEl.style.animationDelay = `${idx * 0.1}s`;

        switch(step.type) {
            case 'header':
                stepEl.innerHTML = `<h3 class="step-header">${step.payload}</h3>`;
                break;
            case 'matrix':
                stepEl.innerHTML = renderMatrix(step.payload);
                break;
            case 'pivot-col':
                // Optional: we could highlight the column here or in renderMatrix
                break;
            case 'multiplier':
                stepEl.innerHTML = `
                    <div class="multiplier-box">
                        <span class="m-label">${step.payload.label} = </span>
                        <div class="fraction">
                            <span class="top">${step.payload.topVal}</span>
                            <span class="bot">${step.payload.botVal}</span>
                        </div>
                        <span class="m-val"> = ${step.payload.mVal}</span>
                    </div>`;
                break;
            case 'row-op':
                if (step.payload.isDiv) {
                    stepEl.innerHTML = `<div class="row-op">R<sub>${step.payload.i}</sub> = R<sub>${step.payload.i}</sub> / ${step.payload.m}</div>`;
                } else {
                    stepEl.innerHTML = `<div class="row-op">R<sub>${step.payload.i}</sub> = R<sub>${step.payload.i}</sub> - (${step.payload.m}) * R<sub>${step.payload.j}</sub></div>`;
                }
                break;
            case 'back-sub':
                let termsHtml = step.payload.terms.map(t => `${t.coef}(${t.val})`).join(' + ');
                stepEl.innerHTML = `
                    <div class="back-sub">
                        <span>${step.payload.xi} = ( ${step.payload.bVal} ${termsHtml ? '- [' + termsHtml + ']' : ''} ) / ${step.payload.a_ii}</span>
                        <span class="res-val"> = ${step.payload.result}</span>
                    </div>`;
                break;
            case 'cramer-det':
                stepEl.innerHTML = `
                    <div class="cramer-step">
                        <h4>${step.payload.label}</h4>
                        ${renderMatrix(step.payload.mat, true)}
                        <p class="det-res">Determinant = <strong>${step.payload.det}</strong></p>
                    </div>`;
                break;
            case 'cramer-sub':
                stepEl.innerHTML = `
                    <div class="cramer-step">
                        <h4>${step.payload.label}</h4>
                        ${renderMatrix(step.payload.mat, true)}
                        <p class="det-res">|${step.payload.label}| = ${step.payload.det}</p>
                        <p class="var-sol">${step.payload.varName} = ${step.payload.det} / ${step.payload.D} = <strong>${step.payload.xi}</strong></p>
                    </div>`;
                break;
            case 'solution':
                let solHtml = step.payload.map(s => `
                    <div class="sol-item">
                        <span class="sol-var">${s.xi} = </span>
                        <span class="sol-val">${s.val}</span>
                    </div>
                `).join('');
                stepEl.innerHTML = `<div class="final-solution"><h4>Final Solution</h4>${solHtml}</div>`;
                break;
        }
        resultDiv.appendChild(stepEl);
    });
}

function renderMatrix(matrix, isDet = false) {
    let html = `<div class="matrix-wrapper ${isDet ? 'det' : 'augmented'}">`;
    html += `<table class="matrix-table">`;
    matrix.forEach(row => {
        html += `<tr>`;
        row.forEach((cell, idx) => {
            let cls = "";
            if (!isDet && idx === row.length - 1) cls = "aug-cell";
            html += `<td class="${cls}">${cell}</td>`;
        });
        html += `</tr>`;
    });
    html += `</table></div>`;
    return html;
}

function clearInputs() {
    document.getElementById("inputs").innerHTML = "";
    document.getElementById("result").innerHTML = "";
    document.getElementById("title").innerText = "Select a Method";
    current = "";
}

function renderEquationInputs(size) {
    let container = document.getElementById("equations-container");
    if (!container) return;
    
    container.innerHTML = "";
    for (let i = 1; i <= size; i++) {
        let input = document.createElement("input");
        input.className = "eq-input";
        input.placeholder = `Equation ${i}`;
        
        if (size === 3) {
            if (i === 1) input.placeholder = "2x + 1y + 1z = 8";
            if (i === 2) input.placeholder = "4x + 1y + 0z = 11";
            if (i === 3) input.placeholder = "-2x + 2y + 1z = 3";
        }
        
        input.onkeydown = function(event) { if (event.key === 'Enter') solve(); };
        container.appendChild(input);
    }
}
