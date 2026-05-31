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

// 💡 日時データから「時:分」だけをきれいに抜き出す便利な関数
function formatShortTime(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === "未入力") return "--:--";
    // 「2026/05/31 10:35:12」や「10:35」などの形式から時間を抽出
    const timeMatch = dateTimeStr.match(/(\d{1,2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : dateTimeStr;
}

// 💡 履歴を描画する関数 ★スリムに見やすく修正
function renderHistory(historyList) {
    if (!historyList || historyList.length === 0) {
        historyBox.innerHTML = "<p style='color:#999;'>履歴はまだありません。</p>";
        return;
    }
    historyBox.innerHTML = "";
    historyList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        // 各時間を「時:分」の形にスッキリ変換
        const arrivalTime = formatShortTime(item.departureTime); // 到着ボタンの時間
        const departureTime = formatShortTime(item.arrivalTime); // 出発ボタンの時間
        const coDepTime = formatShortTime(item.companyDepartureTime); // 市場発の時間
        const coArrTime = formatShortTime(item.companyArrivalTime); // 市場着の時間

        // 💡 乗務・車番を一番上に。メーターは省き、行先と時間をメインに配置
        card.innerHTML = `
            <div style="border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; color: #666; font-size: 11px;">
                ${item.date.split(' ')[0]} ｜ 乗務: <strong>${item.driver || "未"}</strong> ｜ 車番: <strong>${item.carNumber || "未"}</strong>
            </div>
            <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 4px;">
                行先: ${item.company} ${item.shop}
            </div>
            <div style="font-size: 13px; color: #444; line-height: 1.4;">
                ⏱ 到着: <span style="color: #007bff; font-weight: bold;">${arrivalTime}</span> ｜ 出発: <span style="color: #28a745; font-weight: bold;">${departureTime}</span>
                ${(coDepTime !== "--:--" || coArrTime !== "--:--") ? `<br><span style="font-size: 11px; color: #777;">（市場発: ${coDepTime} ／ 市場着: ${coArrTime}）</span>` : ""}
            </div>
        `;
        historyBox.appendChild(card);
    });
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
            
            // 下部の履歴エリアだけを書き換える
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
        startKm: document.getElementById('start-km').value,
        endKm: document.getElementById('end-km').value,
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