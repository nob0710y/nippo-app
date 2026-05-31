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

// 履歴を描画する関数
function renderHistory(historyList) {
    if (!historyList || historyList.length === 0) {
        historyBox.innerHTML = "<p style='color:#999;'>履歴はまだありません。</p>";
        return;
    }
    historyBox.innerHTML = "";
    historyList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        let r走行距離 = "";
        if (item.startKm && item.endKm) {
            r走行距離 = ` (走行: ${item.endKm - item.startKm}km)`;
        }

        card.innerHTML = `
            <strong>日時: ${item.date}</strong><br>
            乗務: ${item.driver || "未入力"} ｜ 車番: ${item.carNumber || "未入力"}<br>
            行先: ${item.company} ${item.shop}<br>
            メーター: ${item.startKm || "-"} -> ${item.endKm || "-"}km${r走行距離}
        `;
        historyBox.appendChild(card);
    });
}

// データ初期読み込み
window.addEventListener('load', async () => {
    statusMessage.innerText = "過去のデータを読み込み中...";
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
            
            renderHistory(resData.history);
            statusMessage.innerText = "最新の状態に更新されました";
        }
    } catch (error) {
        console.error(error);
        statusMessage.innerText = "データの読み込みに失敗しました";
    }
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
            setTimeout(() => { location.reload(); }, 1000);
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