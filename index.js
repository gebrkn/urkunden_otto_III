const SEARCH = `
    <td>
        <table>
            <tr><td colspan="3"><input id="top_search_{n}" class="top_search" oninput="search()"></td></tr>
            <tr>
                <td>
                    <select id="top_scope_{n}" onchange="search()">
                        <option value="">...</option>
                        <option value="cont">cont</option>
                        <option value="date">date</option>
                        <option value="place">place</option>
                        <option value="int">int</option>
                        <option value="pet">pet</option>
                        <option value="text">text</option>
                    </select>
                </td>
                <td>
                    <span id="top_found_count_{n}"></span>
                </td>
                <td>
                    <button id="top_clear_{n}" onclick="clearSearch({n})">x</button>    
                </td>
            </tr>
        </table>
    </td>
`;

const TOP = `
    <table border="0"><tr>
        {SEARCH}
        <td>
            total <br><span id="top_found_count"></span>
        </td>
        <td width="100%">
        </td>
        <td>
            <button id="top_view" onclick="toggleView()">view</button>    
        </td>
        <td>
            <button id="top_save" onclick="save()">SAVE</button>    
        </td>
    </tr></table>
`;

const DOC = `
    <div class="doc" id="doc_{num}">
        <div class="t_num">{num}.</div>
        <div class="t_date"><textarea id="date_{num}">{date}</textarea></div>
        <div class="t_place"><textarea id="place_{num}">{place}</textarea></div>
        <div class="t_pet"><label>pet</label><textarea id="pet_{num}">{pet2}</textarea></div>
        <div class="t_int"><label>int</label><textarea id="int_{num}">{int2}</textarea></div>
        <div class="t_cont"><textarea id="cont_{num}">{cont}</textarea></div>
        <div class="t_text"><textarea id="text_{num}">{text}</textarea></div>
    </div>
`;

const SEARCH_FIELD_COUNT = 5;

//

window.onload = function () {
    init();
    draw();
    runSearch();
};

// utilities

function $(s) {
    return document.querySelector(s);
}

function $$(s) {
    return Array.from(document.querySelectorAll(s));
}

function range(n) {
    return Array(n).fill(0).map((_, n) => n);
}

// initialize the view

function init() {
    $('#top').innerHTML = makeTop();
    $('#content').classList.add('c_form');
}

// create the top bar

function makeTop() {
    let search = range(SEARCH_FIELD_COUNT).map(n => SEARCH.replace(/{n}/g, n)).join('');
    return TOP.replace(/{SEARCH}/g, search);
}

// run a search

let searchTimer = 0;

function search() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 100);
}

function runSearch() {

    let words = range(SEARCH_FIELD_COUNT).map(n => $("#top_search_" + n).value.trim().toUpperCase());
    let scopes = range(SEARCH_FIELD_COUNT).map(n => $("#top_scope_" + n).value);

    DB.forEach(doc => doc.found = 0);

    words.forEach((w, n) => {
        let c = 0;
        DB.forEach(doc => {
            if (matches(doc, w, scopes[n])) {
                c++;
                doc.found++;
            }
        });
        $("#top_found_count_" + n).innerText = c;
    });

    let total = 0;

    DB.forEach(doc => {
        let ok = doc.found === SEARCH_FIELD_COUNT;
        $("#doc_" + doc.num).style.display = ok ? 'block' : 'none';
        total += ok;
    });

    $("#top_found_count").innerText = total;
}

function clearSearch(n) {
    $("#top_search_" + n).value = "";
    runSearch();
}

function matches(doc, word, scope) {
    if (!word)
        return true;
    let keys = scope ? [scope] : ['cont', 'date', 'place', 'pet', 'int'];
    return keys.some(k => String(doc[k]).toUpperCase().includes(word));
}

// collect the data from input boxes

function collect() {
    let docs = {};

    for (let ta of $$('.doc textarea')) {
        let [k, num] = ta.id.split('_');
        let val = ta.value.trim();

        if (!docs[num])
            docs[num] = {
                "cont": "",
                "date": "",
                "int": "",
                "num": num,
                "pet": "",
                "place": "",
                "text": ""
            };
        if (k === 'pet' || k === 'int')
            val = val.split('\n').map(x => x.trim()).filter(Boolean).sort();
        docs[num][k] = val;
    }

    return Object.keys(docs).sort((x, y) => x - y).map(num => docs[num]);
}

// save the data

function save() {
    let db2 = collect();
    let changed = JSON.stringify(DB) !== JSON.stringify(db2);

    $("#top_save").innerText = 'saving...';

    fetch(document.location.href, {
        method: "POST",
        body: JSON.stringify(db2, null, 4)
    }).then(r => $("#top_save").innerText = 'SAVE');

    window.DB = db2;
}

// draw documents

function draw() {
    let html = [];

    for (let doc of DB) {

        html.push(DOC.replace(/{(\w+)}/g, (_, m) => {
            if (m === 'pet2')
                return doc.pet.join('\n');
            if (m === 'int2')
                return doc.int.join('\n');
            return doc[m];
        }));
    }

    $('#content').innerHTML = html.join('\n');
}

// toggle table/form view

function toggleView() {
    let c = $("#content");

    if (c.classList.contains('c_tabx')) {
        c.classList.remove('c_tabx');
        c.classList.add('c_form');
    } else {
        c.classList.remove('c_form');
        c.classList.add('c_tabx');
    }
}