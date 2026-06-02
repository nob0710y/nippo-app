let serverMasterData = {};
const GAS_URL = "https://script.google.com/macros/s/AKfycbwKBITZn5JomjaNMzLSnjHwBIE1qCeKPY7GnPl9dqohwjNUtDh6v5IDlfkG9f5_S7e-TA/exec"; 

const btnCoDeparture = document.getElementById('btn-co-departure');
const btnCoArrival = document.getElementById('btn-co-arrival');
const btnDeparture = document.getElementById('btn-departure');
const btnArrival = document.getElementById('btn-arrival');
const btnPrint = document.getElementById('btn-print');
const btnClearHistory = document.getElementById('btn-clear-history'); 
const statusMessage = document.getElementById('status-message');
const historyBox = document.getElementById('history-box');

const driverInput = document.getElementById('driver');
const driverList = document.getElementById('driver-list');
const carInput = document.getElementById('car-number');
const carList = document.getElementById('car-list');
const companyInput = document.getElementById('company');
const companyList = document.getElementById('company-list');
const shopInput = document.getElementById('shop');
const shopList = document.getElementById('shop-list');

const meterStartInput = document.getElementById('meter-start');
const meterEndInput = document.getElementById('meter-end');

const btnAddRoute = document.getElementById('btn-add-route');
const preRegisteredListDiv = document.getElementById('pre-registered-list');
const currentSelectedTargetSpan = document.getElementById('current-selected-target');

let localHistoryMap = JSON.parse(localStorage.getItem('nippo_local_history')) || {};
let preRegisteredRoutes = JSON.parse(localStorage.getItem('nippo_pre_routes')) || [];
let activeRouteKey = localStorage.getItem('nippo_active_route_key') || "";

function getShortTimeNow() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatShortTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === "未入力" || dateTimeStr === "--:--") return "--:--";
    if (dateTimeStr.length === 5 && dateTimeStr.includes(':')) return dateTimeStr;
    const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : dateTimeStr;
}

function updateDatalist(element, list) {
    element.innerHTML = "";
    list.forEach(item => {
        if (item && item !== "未入力") {
            const option = document.createElement('option');
            option.value = item;
            element.appendChild(option);
        }
    });
}

function setupPopupSequence() {
    driverInput.addEventListener('change', () => { if(driverInput.value) carInput.focus(); });
    carInput.addEventListener('change', () => { if(carInput.value) meterStartInput.focus(); });
    meterStartInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && meterStartInput.value) companyInput.focus(); });
    companyInput.addEventListener('change', () => { if(companyInput.value) shopInput.focus(); });
    shopInput.addEventListener('keydown', (e) => { if(e.key === 'Enter' && shopInput.value) btnAddRoute.focus(); });
}

// 💡【新機能】行先リストの描画（🔼 🔽 ボタンの処理を追加）
function renderPreRegisteredList() {
    preRegisteredListDiv.innerHTML = "";
    preRegisteredRoutes.forEach((route, index) => {
        const key = route.company + "_" + route.shop;
        const badge = document.createElement('div');
        badge.className = `route-badge ${key === activeRouteKey ? 'selected' : ''}`;
        
        badge.innerHTML = `
            <span class="text">${index + 1}. ${route.company} (${route.shop})</span>
            <div class="badge-actions">
                <button class="btn-move-up" data-index="${index}">🔼</button>
                <button class="btn-move-down" data-index="${index}">🔽</button>
                <button class="btn-del-badge" data-index="${index}">削除</button>
            </div>
        `;
        
        // カード本体タップで選択
        badge.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') return; // ボタンタップ時は無視
            selectRoute(key);
        });
        
        // 🔼 ボタン（上へ移動）
        badge.querySelector('.btn-move-up').addEventListener('click', (e) => {
            e.stopPropagation();
            moveRouteOrder(index, -1);
        });
        
        // 🔽 ボタン（下へ移動）
        badge.querySelector('.btn-move-down').addEventListener('click', (e) => {
            e.stopPropagation();
            moveRouteOrder(index, 1);
        });
        
        // 削除ボタン
        badge.querySelector('.btn-del-badge').addEventListener('click', (e) => {
            e.stopPropagation();
            removeRoute(index);
        });
        
        preRegisteredListDiv.appendChild(badge);
    });

    if (activeRouteKey) {
        const parts = activeRouteKey.split('_');
        currentSelectedTargetSpan.innerText = `${parts[0]} - ${parts[1]}`;
    } else {
        currentSelectedTargetSpan.innerText = "（上のリストから選んでください）";
    }
}

// 💡【新機能】リストの並び順を入れ替える処理
function moveRouteOrder(index, direction) {
    const targetIndex = index + direction;
    // 範囲外なら何もしない
    if (targetIndex < 0 || targetIndex >= preRegisteredRoutes.length) return;
    
    // 要素を入れ替え
    const temp = preRegisteredRoutes[index];
    preRegisteredRoutes[index] = preRegisteredRoutes[targetIndex];
    preRegisteredRoutes[targetIndex] = temp;
    
    // 保存して再描画
    localStorage.setItem('nippo_pre_routes', JSON.stringify(preRegisteredRoutes));
    renderPreRegisteredList();
    statusMessage.innerText = "ルートの順序を変更しました。";
}

function selectRoute(key) {
    activeRouteKey = key;
    localStorage.setItem('nippo_active_route_key', activeRouteKey);
    renderPreRegisteredList();
    statusMessage.innerText = "ターゲット行先を切り替えました。";
}

function removeRoute(index) {
    const route = preRegisteredRoutes[index];
    const key = route.company + "_" + route.shop;
    preRegisteredRoutes.splice(index, 1);
    localStorage.setItem('nippo_pre_routes', JSON.stringify(preRegisteredRoutes));
    if (activeRouteKey === key) {
        activeRouteKey = preRegisteredRoutes.length > 0 ? (preRegisteredRoutes[0].company + "_" + preRegisteredRoutes[0].shop) : "";
        localStorage.setItem('nippo_active_route_key', activeRouteKey);
    }
    renderPreRegisteredList();
}

btnAddRoute.addEventListener('click', () => {
    const comp = companyInput.value.trim();
    const shop = shopInput.value.trim() || "本店";
    
    if (!comp) { alert("会社名を入力してください。"); companyInput.focus(); return; }
    
    const isDuplicate = preRegisteredRoutes.some(r => r.company === comp && r.shop === shop);
    if (!isDuplicate) {
        preRegisteredRoutes.push({ company: comp, shop: shop });
        localStorage.setItem('nippo_pre_routes', JSON.stringify(preRegisteredRoutes));
    }
    
    const newKey = comp + "_" + shop;
    if (!activeRouteKey) activeRouteKey = newKey;
    localStorage.setItem('nippo_active_route_key', activeRouteKey);
    
    companyInput.value = "";
    shopInput.value = "";
    
    renderPreRegisteredList();
    companyInput.focus(); 
});

function advanceToNextRoute() {
    if (preRegisteredRoutes.length === 0 || !activeRouteKey) return;

    const currentIndex = preRegisteredRoutes.findIndex(r => (r.company + "_" + r.shop) === activeRouteKey);
    
    if (currentIndex !== -1 && currentIndex + 1 < preRegisteredRoutes.length) {
        const nextRoute = preRegisteredRoutes[currentIndex + 1];
        const nextKey = nextRoute.company + "_" + nextRoute.shop;
        
        setTimeout(() => {
            selectRoute(nextKey);
            statusMessage.innerText = `前の現場を出発しました。次は「${nextRoute.company}」に自動セットされました。`;
        }, 1000);
    } else {
        setTimeout(() => {
            statusMessage.innerText = "すべての予定行先が終了しました！到着メーターを入力してください。";
            meterEndInput.focus(); 
        }, 1000);
    }
}

function refreshDisplayGrid() {
    let printContainer = document.getElementById('print-table-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-table-container';
        document.querySelector('.app-container').appendChild(printContainer);
    }

    const keys = Object.keys(localHistoryMap);
    if (keys.length === 0) {
        historyBox.innerHTML = "<p style='color:#999;'>履歴はまだありません。</p>";
        printContainer.innerHTML = "<p>印刷するデータがありません。</p>";
        return;
    }

    historyBox.innerHTML = "";
    let tableHtml = `<table class="print-table"><thead><tr><th>日付</th><th>乗務員</th><th>車番</th><th>行先</th><th>到着</th><th>出発</th><th>市場発</th><th>市場着</th><th>開始</th><th>終了</th></tr></thead><tbody>`;

    keys.forEach(mapKey => {
        const item = localHistoryMap[mapKey];
        const arrivalTime = formatShortTime(item.departureTime);
        const departureTime = formatShortTime(item.arrivalTime);
        const coDepTime = formatShortTime(item.companyDepartureTime);
        const coArrTime = formatShortTime(item.companyArrivalTime);

        let displayDate = "-";
        if (item.date) {
            const onlyDate = item.date.replace('T', ' ').split(' ')[0];
            const dateParts = onlyDate.split('-');
            if (dateParts.length >= 3) displayDate = `${dateParts[1]}-${dateParts[2]}`;
        }

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div style="color: #666; font-size: 11px;">乗務: <strong>${item.driver}</strong> ｜ 車番: <strong>${item.carNumber}</strong></div>
            <div style="font-size: 14px; font-weight: bold; color: #333;">行先: ${item.company} ${item.shop}</div>
            <div style="font-size: 24px; font-weight: bold; color: #222;">到着: <span style="color:#007bff;">${arrivalTime}</span> ｜ 出発: <span style="color:#28a745;">${departureTime}</span></div>
            <div style="font-size: 11px; color: #777;">市場発: ${coDepTime} ｜ 市場着: ${coArrTime} ｜ メーター: ${item.meterStart}〜${item.meterEnd}km</div>
        `;
        historyBox.appendChild(card);

        tableHtml += `<tr><td>${displayDate}</td><td>${item.driver}</td><td>${item.carNumber}</td><td>${item.company} ${item.shop}</td><td>${arrivalTime}</td><td>${departureTime}</td><td>${coDepTime}</td><td>${coArrTime}</td><td>${item.meterStart}</td><td>${item.meterEnd}</td></tr>`;
    });

    tableHtml += `</tbody></table>`;
    printContainer.innerHTML = tableHtml;
}

function processActionImmediate(timeKey) {
    if (!activeRouteKey) { alert("行先リストから、今から稼働する目的地をタップして選択してください。"); return; }
    
    const dVal = driverInput.value.trim();
    const cVal = carInput.value.trim();
    const mStartVal = meterStartInput.value.trim();
    const mEndVal = meterEndInput.value.trim();

    if (!dVal || !cVal) { alert('運転手名と車番を入力してください。'); return; }

    const parts = activeRouteKey.split('_');
    const compVal = parts[0];
    const shopVal = parts[1];

    const currentShortTime = getShortTimeNow(); 
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (!localHistoryMap[activeRouteKey]) {
        localHistoryMap[activeRouteKey] = {
            date: dateStr, driver: dVal, carNumber: cVal, company: compVal, shop: shopVal,
            departureTime: "", arrivalTime: "", companyDepartureTime: "", companyArrivalTime: "",
            meterStart: mStartVal, meterEnd: mEndVal
        };
    }

    localHistoryMap[activeRouteKey][timeKey] = currentShortTime;
    localHistoryMap[activeRouteKey].driver = dVal;
    localHistoryMap[activeRouteKey].carNumber = cVal;
    if (mStartVal) localHistoryMap[activeRouteKey].meterStart = mStartVal;
    if (mEndVal) localHistoryMap[activeRouteKey].meterEnd = mEndVal;

    localStorage.setItem('nippo_local_history', JSON.stringify(localHistoryMap)); 
    refreshDisplayGrid(); 

    const postData = {
        date: localHistoryMap[activeRouteKey].date, 
        driver: dVal, carNumber: cVal, company: compVal, shop: shopVal,
        departureTime: localHistoryMap[activeRouteKey].departureTime || "",
        arrivalTime: localHistoryMap[activeRouteKey].arrivalTime || "",
        companyDepartureTime: localHistoryMap[activeRouteKey].companyDepartureTime || "",
        companyArrivalTime: localHistoryMap[activeRouteKey].companyArrivalTime || "",
        meterStart: localHistoryMap[activeRouteKey].meterStart || "", 
        meterEnd: localHistoryMap[activeRouteKey].meterEnd || ""       
    };

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(postData)
    }).then(res => {
        if (res.ok) {
            statusMessage.innerText = `${compVal}の「${timeKey === 'arrivalTime' ? '出発' : '到着'}」をシートへ同期しました！`;
            if (timeKey === 'arrivalTime') {
                advanceToNextRoute();
            }
        }
    }).catch(err => {
        statusMessage.innerText = "【オフライン保存中】データは安全です。";
        if (timeKey === 'arrivalTime') {
            advanceToNextRoute();
        }
    });
}

async function fetchInitialData() {
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            const resData = await response.json();
            if (resData.drivers) updateDatalist(driverList, resData.drivers);
            if (resData.carNumbers) updateDatalist(carList, resData.carNumbers);
            serverMasterData = resData.targetMaster || {};
            updateDatalist(companyList, Object.keys(serverMasterData));
            refreshDisplayGrid();
        }
    } catch (e) { console.error(e); }
}

window.addEventListener('load', async () => {
    refreshDisplayGrid(); 
    renderPreRegisteredList();
    setupPopupSequence();
    await fetchInitialData();
    statusMessage.innerText = "いつでも入力可能です";
});

companyInput.addEventListener('input', () => {
    const selectedCompany = companyInput.value;
    if (selectedCompany && serverMasterData[selectedCompany]) {
        updateDatalist(shopList, serverMasterData[selectedCompany]);
    } else {
        shopList.innerHTML = "";
    }
});

btnClearHistory.addEventListener('click', () => {
    if (confirm("スマホ内の本日の履歴・事前登録をリセットしますか？")) {
        localHistoryMap = {}; preRegisteredRoutes = []; activeRouteKey = "";
        localStorage.removeItem('nippo_local_history');
        localStorage.removeItem('nippo_pre_routes');
        localStorage.removeItem('nippo_active_route_key');
        meterStartInput.value = ""; meterEndInput.value = "";
        refreshDisplayGrid(); renderPreRegisteredList();
        statusMessage.innerText = "リセットしました。";
    }
});

btnCoDeparture.addEventListener('click', () => { processActionImmediate('companyDepartureTime'); });
btnCoArrival.addEventListener('click', () => { processActionImmediate('companyArrivalTime'); });
btnDeparture.addEventListener('click', () => { processActionImmediate('departureTime'); });
btnArrival.addEventListener('click', () => { processActionImmediate('arrivalTime'); });
btnPrint.addEventListener('click', () => { window.print(); });