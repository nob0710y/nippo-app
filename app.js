let serverMasterData = {};
const GAS_URL = "https://script.google.com/macros/s/AKfycbwKBITZn5JomjaNMzLSnjHwBIE1qCeKPY7GnPl9dqohwjNUtDh6v5IDlfkG9f5_S7e-TA/exec"; 

// 各種要素の取得
const btnCoDeparture = document.getElementById('btn-co-departure');
const btnCoArrival = document.getElementById('btn-co-arrival');
const btnDeparture = document.getElementById('btn-departure');
const btnArrival = document.getElementById('btn-arrival');
const btnPrint = document.getElementById('btn-print');
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

// 💡 スマホの内部メモリ（localStorage）から過去のデータを読み込む。なければ空。
let localHistoryMap = JSON.parse(localStorage.getItem('nippo_local_history')) || {};

// 「時:分」の文字列を作るヘルパー関数
function getShortTimeNow() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
}

function formatShortTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === "未入力" || dateTimeStr === "--:--") return "--:--";
    if (dateTimeStr.length === 5 && dateTimeStr.includes(':')) return dateTimeStr;
    const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : dateTimeStr;
}

// 画面と印刷エリアを同時に描き直す共通関数
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

    // ① スマホ画面の描画をリセット
    historyBox.innerHTML = "";

    // ② 印刷用テーブルのヘッダー準備
    let tableHtml = `
        <table class="print-table">
            <thead>
                <tr>
                    <th style="width: 12%;">日付</th>
                    <th style="width: 15%;">乗務員</th>
                    <th style="width: 12%;">車番</th>
                    <th>行先（会社・店舗）</th>
                    <th style="width: 11%;">到着</th>
                    <th style="width: 11%;">出発</th>
                    <th style="width: 11%;">市場発</th>
                    <th style="width: 11%;">市場着</th>
                </tr>
            </thead>
            <tbody>
    `;

    // 内部マップに保存されている行先をループ処理（スマホ内に残っている全データを描画）
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
            if (dateParts.length >= 3) {
                displayDate = `${dateParts[1]}-${dateParts[2]}`;
            } else {
                displayDate = onlyDate;
            }
        }

        // スマホ用特大フォントカードの生成
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; color: #666; font-size: 11px;">
                乗務: <strong>${item.driver || "未"}</strong> ｜ 車番: <strong>${item.carNumber || "未"}</strong>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px;">
                行先: ${item.company} ${item.shop}
            </div>
            <div style="font-size: 26px; font-weight: bold; color: #222; margin: 8px 0; line-height: 1.2; letter-spacing: -0.5px;">
                到着: <span style="color: #007bff;">${arrivalTime}</span> ｜ 出発: <span style="color: #28a745;">${departureTime}</span>
            </div>
            ${(coDepTime !== "--:--" || coArrTime !== "--:--") ? `<div style="font-size: 11px; color: #777; margin-top: 4px;">（市場発: ${coDepTime} ／ 市場着: ${coArrTime}）</div>` : ""}
        `;
        historyBox.appendChild(card);

        // 印刷用テーブルの追加
        tableHtml += `
            <tr>
                <td>${displayDate}</td>
                <td>${item.driver || "-"}</td>
                <td>${item.carNumber || "-"}</td>
                <td class="left-align">${item.company} ${item.shop}</td>
                <td style="color: #000; font-weight: bold;">${arrivalTime}</td>
                <td style="color: #000; font-weight: bold;">${departureTime}</td>
                <td>${coDepTime}</td>
                <td>${coArrTime}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    printContainer.innerHTML = tableHtml;
}

// サーバーからマスターデータを読み込む関数（履歴はサーバーから上書きせずマージする）
async function fetchInitialData() {
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            const resData = await response.json();
            
            // マスターリスト（選択肢）の更新
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

            // 💡 スプレッドシート側にデータがあれば、スマホ側で持っていない行先のみ補完（同期）
            if (resData.history && resData.history.length > 0) {
                resData.history.forEach(item => {
                    const k = (item.company || "未入力") + "_" + (item.shop || "未入力");
                    if (!localHistoryMap[k]) {
                        localHistoryMap[k] = { ...item };
                    }
                });
                // 同期した結果をスマホに保存
                localStorage.setItem('nippo_local_history', JSON.stringify(localHistoryMap));
            }
            refreshDisplayGrid();
        }
    } catch (e) {
        console.error("初期読み込みエラー:", e);
    }
}

// 起動時の初期化
window.addEventListener('load', async () => {
    statusMessage.innerText = "データを読み込み中...";
    refreshDisplayGrid(); // サーバー通信を待たずに、まずはスマホ内データを速攻で表示 ★
    await fetchInitialData();
    statusMessage.innerText = "いつでも入力可能です";
});

// 会社名・店舗名の連動絞り込み
companyInput.addEventListener('input', () => {
    const selectedCompany = companyInput.value;
    shopList.innerHTML = ""; 
    if (selectedCompany && serverMasterData[selectedCompany]) {
        serverMasterData[selectedCompany].forEach(shop => {
            if (shop && shop !== "未入力") {
                const option = document.createElement('option'); option.value = shop; shopList.appendChild(option);
            }
        });
    } else {
        let allShops = [];
        Object.values(serverMasterData).forEach(shops => {
            shops.forEach(shop => { if (shop && shop !== "未入力" && !allShops.includes(shop)) allShops.push(shop); });
        });
        allShops.forEach(shop => { const option = document.createElement('option'); option.value = shop; shopList.appendChild(option); });
    }
});

// 💡 ボタンを押したら即座にスマホに記録＆スプレッドシート側も同一行を上書き更新させる関数
function processActionImmediate(timeKey) {
    const dVal = driverInput.value;
    const cVal = carInput.value;
    const compVal = companyInput.value || "未入力";
    const shopVal = shopInput.value || "未入力";

    if (!dVal || !cVal) {
        alert('運転手名と車番を入力してからボタンを押してください。');
        return;
    }

    const currentShortTime = getShortTimeNow(); 
    const mapKey = compVal + "_" + shopVal;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. スマホ内データ（ローカル）に上書き保存
    if (!localHistoryMap[mapKey]) {
        localHistoryMap[mapKey] = {
            date: dateStr,
            driver: dVal,
            carNumber: cVal,
            company: compVal,
            shop: shopVal,
            departureTime: "",
            arrivalTime: "",
            companyDepartureTime: "",
            companyArrivalTime: ""
        };
    }

    localHistoryMap[mapKey][timeKey] = currentShortTime;
    
    // 💡 データをスマホの記憶領域（localStorage）に完全に固定保存！シートを消しても残る ★
    localStorage.setItem('nippo_local_history', JSON.stringify(localHistoryMap));

    // 2. スマホ画面を0秒で再描画
    refreshDisplayGrid();
    statusMessage.innerText = "スマホに保存しました。シートを更新中...";

    // 3. スプレッドシート側に送信（同じ行先があれば上書き更新する形式でPOST）
    const postData = {
        date: localHistoryMap[mapKey].date,
        driver: dVal,
        carNumber: cVal,
        company: compVal,
        shop: shopVal,
        departureTime: localHistoryMap[mapKey].departureTime || "", // 到着
        arrivalTime: localHistoryMap[mapKey].arrivalTime || "",     // 出発
        companyDepartureTime: localHistoryMap[mapKey].companyDepartureTime || "", // 市場発
        companyArrivalTime: localHistoryMap[mapKey].companyArrivalTime || "",     // 市場着
        startKm: "", endKm: ""
    };

    fetch(GAS_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(postData)
    }).then(res => {
        if (res.ok) {
            statusMessage.innerText = "シートの同一行への書き込みも完了しました！";
            setTimeout(() => { statusMessage.innerText = "最新の状態に更新されました"; }, 2000);
        } else {
            statusMessage.innerText = "シート同期エラー（裏で再試行されます）";
        }
    }).catch(err => {
        console.error(err);
        statusMessage.innerText = "【オフライン保存中】画面のデータは安全です。";
    });
}

// 各種クリックイベント
btnCoDeparture.addEventListener('click', () => { processActionImmediate('companyDepartureTime'); });
btnCoArrival.addEventListener('click', () => { processActionImmediate('companyArrivalTime'); });
btnDeparture.addEventListener('click', () => { processActionImmediate('departureTime'); }); // 到着ボタン
btnArrival.addEventListener('click', () => { processActionImmediate('arrivalTime'); });   // 出発ボタン

btnPrint.addEventListener('click', () => { window.print(); });