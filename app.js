let serverMasterData = {};
const GAS_URL = "https://script.google.com/macros/s/AKfycbwKBITZn5JomjaNMzLSnjHwBIE1qCeKPY7GnPl9dqohwjNUtDh6v5IDlfkG9f5_S7e-TA/exec"; 

const btnCoDeparture = document.getElementById('btn-co-departure');
const btnCoArrival = document.getElementById('btn-co-arrival');
const btnDeparture = document.getElementById('btn-departure');
const btnArrival = document.getElementById('btn-arrival');
const btnPrint = document.getElementById('btn-print');
const btnClearHistory = document.getElementById('btn-clear-history'); // 💡クリアボタンの取得
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

// スマホのローカルストレージ（内部メモリ）からデータを引き出す（シート消去対策）
let localHistoryMap = JSON.parse(localStorage.getItem('nippo_local_history')) || {};

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

    let tableHtml = `
        <table class="print-table">
            <thead>
                <tr>
                    <th style="width: 12%;">日付</th><th style="width: 15%;">乗務員</th><th style="width: 12%;">車番</th>
                    <th>行先（会社・店舗）</th><th style="width: 11%;">到着</th><th style="width: 11%;">出発</th>
                    <th style="width: 11%;">市場発</th><th style="width: 11%;">市場着</th>
                </tr>
            </thead>
            <tbody>
    `;

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
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; color: #666; font-size: 11px;">
                乗務: <strong>${item.driver || "未"}</strong> ｜ 車番: <strong>${item.carNumber || "未"}</strong>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">
                行先: ${item.company} ${item.shop}
            </div>
            <div style="font-size: 26px; font-weight: bold; color: #222; margin: 8px 0; line-height: 1.2;">
                到着: <span style="color: #007bff;">${arrivalTime}</span> ｜ 出発: <span style="color: #28a745;">${departureTime}</span>
            </div>
            ${(coDepTime !== "--:--" || coArrTime !== "--:--") ? `<div style="font-size: 11px; color: #777;">（市場発: ${coDepTime} ／ 市場着: ${coArrTime}）</div>` : ""}
        `;
        historyBox.appendChild(card);

        tableHtml += `
            <tr>
                <td>${displayDate}</td><td>${item.driver || "-"}</td><td>${item.carNumber || "-"}</td>
                <td class="left-align">${item.company} ${item.shop}</td>
                <td style="font-weight: bold;">${arrivalTime}</td><td style="font-weight: bold;">${departureTime}</td>
                <td>${coDepTime}</td><td>${coArrTime}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    printContainer.innerHTML = tableHtml;
}

async function fetchInitialData() {
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            const resData = await response.json();
            if (resData.drivers) {
                driverList.innerHTML = "";
                resData.drivers.forEach(d => { const o = document.createElement('option'); o.value = d; driverList.appendChild(o); });
            }
            if (resData.carNumbers) {
                carList.innerHTML = "";
                resData.carNumbers.forEach(c => { const o = document.createElement('option'); o.value = c; carList.appendChild(o); });
            }
            serverMasterData = resData.targetMaster || {};
            companyList.innerHTML = "";
            Object.keys(serverMasterData).forEach(comp => {
                if (comp && comp !== "未入力") {
                    const o = document.createElement('option'); o.value = comp; companyList.appendChild(o);
                }
            });

            if (resData.history && resData.history.length > 0) {
                resData.history.forEach(item => {
                    const k = (item.company || "未入力") + "_" + (item.shop || "未入力");
                    if (!localHistoryMap[k]) localHistoryMap[k] = { ...item };
                });
                localStorage.setItem('nippo_local_history', JSON.stringify(localHistoryMap));
            }
            refreshDisplayGrid();
        }
    } catch (e) { console.error(e); }
}

window.addEventListener('load', async () => {
    statusMessage.innerText = "データを読み込み中...";
    refreshDisplayGrid(); 
    await fetchInitialData();
    statusMessage.innerText = "いつでも入力可能です";
});

companyInput.addEventListener('input', () => {
    const selectedCompany = companyInput.value;
    shopList.innerHTML = ""; 
    if (selectedCompany && serverMasterData[selectedCompany]) {
        serverMasterData[selectedCompany].forEach(shop => {
            const option = document.createElement('option'); option.value = shop; shopList.appendChild(option);
        });
    }
});

function processActionImmediate(timeKey) {
    const dVal = driverInput.value;
    const cVal = carInput.value;
    const compVal = companyInput.value || "未入力";
    const shopVal = shopInput.value || "未入力";

    if (!dVal || !cVal) { alert('運転手名と車番を入力してください。'); return; }

    const currentShortTime = getShortTimeNow(); 
    const mapKey = compVal + "_" + shopVal;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (!localHistoryMap[mapKey]) {
        localHistoryMap[mapKey] = {
            date: dateStr, driver: dVal, carNumber: cVal, company: compVal, shop: shopVal,
            departureTime: "", arrivalTime: "", companyDepartureTime: "", companyArrivalTime: ""
        };
    }

    localHistoryMap[mapKey][timeKey] = currentShortTime;
    localStorage.setItem('nippo_local_history', JSON.stringify(localHistoryMap)); 

    refreshDisplayGrid(); 
    statusMessage.innerText = "スマホに保存完了。シートを更新中...";

    const postData = {
        date: localHistoryMap[mapKey].date, driver: dVal, carNumber: cVal, company: compVal, shop: shopVal,
        departureTime: localHistoryMap[mapKey].departureTime || "",
        arrivalTime: localHistoryMap[mapKey].arrivalTime || "",
        companyDepartureTime: localHistoryMap[mapKey].companyDepartureTime || "",
        companyArrivalTime: localHistoryMap[mapKey].companyArrivalTime || ""
    };

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(postData)
    }).then(res => {
        if (res.ok) statusMessage.innerText = "シートの同一行への同期も成功しました！";
    }).catch(err => {
        statusMessage.innerText = "【オフライン保存中】画面のデータは安全です。";
    });
}

// 💡 履歴を一括クリアするイベント処理（確認用ポップアップ付き）
btnClearHistory.addEventListener('click', () => {
    const isConfirmed = confirm("スマホに保存されている本日の履歴をすべて削除しますか？\n（※スプレッドシート側のデータは削除されません）");
    
    if (isConfirmed) {
        localHistoryMap = {}; // ローカルデータを空っぽにする
        localStorage.removeItem('nippo_local_history'); // スマホメモリから完全抹消
        refreshDisplayGrid(); // 画面を再描画（「履歴はまだありません」になる）
        statusMessage.innerText = "履歴をすべてクリアしました。";
        setTimeout(() => { statusMessage.innerText = "いつでも入力可能です"; }, 3000);
    }
});

btnCoDeparture.addEventListener('click', () => { processActionImmediate('companyDepartureTime'); });
btnCoArrival.addEventListener('click', () => { processActionImmediate('companyArrivalTime'); });
btnDeparture.addEventListener('click', () => { processActionImmediate('departureTime'); });
btnArrival.addEventListener('click', () => { processActionImmediate('arrivalTime'); });
btnPrint.addEventListener('click', () => { window.print(); });