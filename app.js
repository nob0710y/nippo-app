let reportData = {
    driver: "",
    carNumber: "",
    companyDepartureTime: "", // 💡 自社出発 ★新設
    companyArrivalTime: "",   // 💡 自社帰庫   ★新設
    departureTime: "",
    arrivalTime: "",
    company: "",
    shop: ""
};

let serverMasterData = {};

// ボタン要素の取得
const btnCoDeparture = document.getElementById('btn-co-departure'); // ★新設
const btnCoArrival = document.getElementById('btn-co-arrival');     // ★新設
const btnDeparture = document.getElementById('btn-departure');
const btnArrival = document.getElementById('btn-arrival');
const btnSave = document.getElementById('btn-save');
const btnPrint = document.getElementById('btn-print');
const statusMessage = document.getElementById('status-message');

const driverInput = document.getElementById('driver');
const driverList = document.getElementById('driver-list');
const carInput = document.getElementById('car-number');
const carList = document.getElementById('car-list');
const companyInput = document.getElementById('company');
const companyList = document.getElementById('company-list');
const shopInput = document.getElementById('shop');
const shopList = document.getElementById('shop-list');

const GAS_URL = "https://script.google.com/macros/s/AKfycbwKBITZn5JomjaNMzLSnjHwBIE1qCeKPY7GnPl9dqohwjNUtDh6v5IDlfkG9f5_S7e-TA/exec"; 

// アプリ起動時にスプレッドシートから過去のデータをすべて読み込む
window.addEventListener('load', async () => {
    statusMessage.innerText = "⏳ 過去のデータを読み込み中...";
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            const resData = await response.json();
            
            // 1. 運転手リスト
            driverList.innerHTML = "";
            if (resData.drivers) {
                resData.drivers.forEach(driver => {
                    const option = document.createElement('option');
                    option.value = driver;
                    driverList.appendChild(option);
                });
            }

            // 2. 車番リスト
            carList.innerHTML = "";
            if (resData.carNumbers) {
                resData.carNumbers.forEach(car => {
                    const option = document.createElement('option');
                    option.value = car;
                    carList.appendChild(option);
                });
            }

            // 3. 会社名・店舗リスト
            serverMasterData = resData.targetMaster || {};
            companyList.innerHTML = "";
            Object.keys(serverMasterData).forEach(company => {
                const option = document.createElement('option');
                option.value = company;
                companyList.appendChild(option);
            });
            
            statusMessage.innerText = "✅ データの準備ができました";
        }
    } catch (error) {
        console.error(error);
        statusMessage.innerText = "⚠️ 過去データの読み込みに失敗しました";
    }
});

// 連動処理
companyInput.addEventListener('input', () => {
    const selectedCompany = companyInput.value;
    shopList.innerHTML = ""; 
    if (selectedCompany && serverMasterData[selectedCompany]) {
        serverMasterData[selectedCompany].forEach(shop => {
            const option = document.createElement('option');
            option.value = shop;
            shopList.appendChild(option);
        });
    }
});

// 💡 🏠自社出発ボタンを押したとき ★新設
btnCoDeparture.addEventListener('click', () => {
    const now = new Date();
    reportData.companyDepartureTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🏠 自社出発を記録 (${now.toLocaleTimeString('ja-JP')})`;
});

// 💡 🏠自社帰庫ボタンを押したとき ★新設
btnCoArrival.addEventListener('click', () => {
    const now = new Date();
    reportData.companyArrivalTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🏠 自社帰庫を記録 (${now.toLocaleTimeString('ja-JP')})`;
});

// 🛫 出発ボタン
btnDeparture.addEventListener('click', () => {
    const now = new Date();
    reportData.departureTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🛫 到着時刻を記録 (${now.toLocaleTimeString('ja-JP')})`;
});

// 🛬 帰庫ボタン
btnArrival.addEventListener('click', () => {
    const now = new Date();
    reportData.arrivalTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🛬 出発時刻を記録 (${now.toLocaleTimeString('ja-JP')})`;
});

// 保存ボタン
btnSave.addEventListener('click', async () => {
    reportData.driver = driverInput.value;
    reportData.carNumber = carInput.value;
    reportData.company = companyInput.value;
    reportData.shop = shopInput.value;

    if (!reportData.driver || !reportData.carNumber || !reportData.company) {
        alert('運転手名、車番、会社名を入力してください。');
        return;
    }

    statusMessage.innerText = "⏳ データを送信中...";

    try {
        const response = await fetch(GAS_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(reportData)
        });

        if (response.ok) {
            statusMessage.innerText = "✅ スプレッドシートへ自動記録しました！";
            
            // 一部をクリア（次回入力用）
            companyInput.value = "";
            shopInput.value = "";
            // 時刻データも次のターンのために一度リセット
            reportData.companyDepartureTime = "";
            reportData.companyArrivalTime = "";
            reportData.departureTime = "";
            reportData.arrivalTime = "";
        } else {
            statusMessage.innerText = "❌ 送信エラーが発生しました。";
        }
    } catch (error) {
        console.error(error);
        statusMessage.innerText = "❌ 接続に失敗しました。";
    }
});

// 印刷ボタン
btnPrint.addEventListener('click', () => {
    window.print();
});