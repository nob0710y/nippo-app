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

// 日時データから「時:分」だけをきれいに抜き出す便利な関数
function formatShortTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === "未入力") return "--:--";
    const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : dateTimeStr;
}

// 💡 履歴を描画する関数 ★同一行先を合体し、到着・出発を2倍サイズにする修正
function renderHistory(historyList) {
    let printContainer = document.getElementById('print-table-container');
    if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'print-table-container';
        document.querySelector('.app-container').appendChild(printContainer);
    }

    if (!historyList || historyList.length === 0) {
        historyBox.innerHTML = "<p style='color:#999;'>履歴はまだありません。</p>";
        printContainer.innerHTML = "<p>印刷するデータがありません。</p>";
        return;
    }

    // --- 💡 同一の会社名・店舗名データを1つにまとめる（合体処理） ---
    const mergedHistory = [];
    historyList.forEach(item => {
        // すでにまとめたリストの中に、同じ会社名・店舗名のものがあるか探す
        const existing = mergedHistory.find(m => m.company === item.company && m.shop === item.shop);
        
        if (existing) {
            // すでにあれば、空いている時間枠に上書き・統合していく
            if (item.departureTime && item.departureTime !== "未入力") existing.departureTime = item.departureTime;
            if (item.arrivalTime && item.arrivalTime !== "未入力") existing.arrivalTime = item.arrivalTime;
            if (item.companyDepartureTime && item.companyDepartureTime !== "未入力") existing.companyDepartureTime = item.companyDepartureTime;
            if (item.companyArrivalTime && item.companyArrivalTime !== "未入力") existing.companyArrivalTime = item.companyArrivalTime;
            if (item.date) existing.date = item.date; // 最新の日付に更新
        } else {
            // なければ新規としてリストに加える
            mergedHistory.push({ ...item });
        }
    });

    // --- ① スマホ画面用の表示を作成 ---
    historyBox.innerHTML = "";
    
    // --- ② 印刷用の表（テーブル）の骨組みを開始 ---
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

    // 合体済みの綺麗なデータをもとに、画面と印刷用の両方を組み立てる
    mergedHistory.forEach(item => {
        const arrivalTime = formatShortTime(item.departureTime); 
        const departureTime = formatShortTime(item.arrivalTime); 
        const coDepTime = formatShortTime(item.companyDepartureTime); 
        const coArrTime = formatShortTime(item.companyArrivalTime); 

        // 日付を「月-日」にする
        let displayDate = "-";
        if (item.date) {
            const onlyDate = item.date.replace('T', ' ').split(' ')[0]; 
            const dateParts = onlyDate.split('-');
            if (dateParts.length >= 3) displayDate = `${dateParts[1]}-${dateParts[2]}`;
        }

        // スマホ画面用カードの組み立て（到着・出発を2倍のサイズに！）
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

        // 印刷用テーブルの行を組み立て（印刷時も合体した1行になります）
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

// サーバーから最新の履歴とマスターデータを取得して画面を更新する関数
async function fetchAndRefreshData() {
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            const resData = await response.json();
            
            // 運転手リスト
            driverList.innerHTML = "";
            if (resData.drivers) {
                resData.drivers.forEach(driver => {
                    const option = document.createElement('option');
                    option.value = driver;
                    driverList.appendChild(option);
                });
            }

            // 車番リスト
            carList.innerHTML = "";
            if (resData.carNumbers) {
                resData.carNumbers.forEach(car => {
                    const option = document.createElement('option');
                    option.value = car;
                    carList.appendChild(option);
                });
            }

            // 会社名リスト
            serverMasterData = resData.targetMaster || {};
            companyList.innerHTML = "";
            Object.keys(serverMasterData).forEach(company => {
                if (company && company !== "未入力") {
                    const option = document.createElement('option');
                    option.value = company;
                    companyList.appendChild(option);
                }
            });
            
            // 店舗名全リスト
            shopList.innerHTML = "";
            let allShops = [];
            Object.values(serverMasterData).forEach(shops => {
                shops.forEach(shop => {
                    if (shop && shop !== "未入力" && !allShops.includes(shop)) {
                        allShops.push(shop);
                    }
                });
            });
            allShops.forEach(shop => {
                const option = document.createElement('option');
                option.value = shop;
                shopList.appendChild(option);
            });
            
            // 下部の履歴エリアと印刷用データを書き換える
            renderHistory(resData.history);
        }
    } catch (error) {
        console.error("データ更新エラー:", error);
    }
}

// データ初期読み込み
window.addEventListener('load', async () => {
    statusMessage.innerText = "過去のデータを読み込み中...";
    await fetchAndRefreshData();
    statusMessage.innerText = "最新の状態に更新されました";
});

// 会社名・店舗名の連動絞り込み
companyInput.addEventListener('input', () => {
    const selectedCompany = companyInput.value;
    shopList.innerHTML = ""; 
    
    if (selectedCompany && serverMasterData[selectedCompany]) {
        serverMasterData[selectedCompany].forEach(shop => {
            if (shop && shop !== "未入力") {
                const option = document.createElement('option');
                option.value = shop;
                shopList.appendChild(option);
            }
        });
    } else {
        let allShops = [];
        Object.values(serverMasterData).forEach(shops => {
            shops.forEach(shop => {
                if (shop && shop !== "未入力" && !allShops.includes(shop)) {
                    allShops.push(shop);
                }
            });
        });
        allShops.forEach(shop => {
            const option = document.createElement('option');
            option.value = shop;
            shopList.appendChild(option);
        });
    }
});

// 自動保存関数
async function saveDataAutomatically(timeKey, timeValue, successMsg) {
    let instantData = {
        driver: driverInput.value,
        carNumber: carInput.value,
        companyDepartureTime: "",
        companyArrivalTime: "",
        departureTime: "",
        arrivalTime: "",
        startKm: "", 
        endKm: "",
        company: companyInput.value || "未入力",
        shop: shopInput.value || "未入力"
    };

    instantData[timeKey] = timeValue;

    if (!instantData.driver || !instantData.carNumber) {
        alert('運転手名と車番を入力してからボタンを押してください。');
        return;
    }

    statusMessage.innerText = "データを自動保存中...";

    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(instantData)
        });

        if (response.ok) {
            statusMessage.innerText = successMsg + " リアルタイム保存に成功しました。";
            await fetchAndRefreshData();
            setTimeout(() => { statusMessage.innerText = "最新の状態に更新されました"; }, 3000);
        } else {
            statusMessage.innerText = "自動保存に失敗しました。";
        }
    } catch (error) {
        console.error(error);
        statusMessage.innerText = "通信エラーが発生しました。";
    }
}

// クリックイベント
btnCoDeparture.addEventListener('click', () => {
    const timeStr = new Date().toLocaleString('ja-JP');
    saveDataAutomatically('companyDepartureTime', timeStr, '市場発を記録しました。');
});
btnCoArrival.addEventListener('click', () => {
    const timeStr = new Date().toLocaleString('ja-JP');
    saveDataAutomatically('companyArrivalTime', timeStr, '市場着を記録しました。');
});
btnDeparture.addEventListener('click', () => {
    const timeStr = new Date().toLocaleString('ja-JP');
    saveDataAutomatically('departureTime', timeStr, '到着を記録しました。');
});
btnArrival.addEventListener('click', () => {
    const timeStr = new Date().toLocaleString('ja-JP');
    saveDataAutomatically('arrivalTime', timeStr, '出発を記録しました。');
});

btnPrint.addEventListener('click', () => { window.print(); });