let reportData = {
    driver: "",
    carNumber: "",
    departureTime: "",
    arrivalTime: "",
    company: "",
    shop: ""
};

let serverMasterData = {};

const btnDeparture = document.getElementById('btn-departure');
const btnArrival = document.getElementById('btn-arrival');
const btnSave = document.getElementById('btn-save');
const btnPrint = document.getElementById('btn-print'); // 💡印刷ボタン
const statusMessage = document.getElementById('status-message');

const companyInput = document.getElementById('company');
const shopInput = document.getElementById('shop');
const companyList = document.getElementById('company-list');
const shopList = document.getElementById('shop-list');

const GAS_URL = "https://script.google.com/macros/s/AKfycbwKBITZn5JomjaNMzLSnjHwBIE1qCeKPY7GnPl9dqohwjNUtDh6v5IDlfkG9f5_S7e-TA/exec"; 

// 過去データの読み込み
window.addEventListener('load', async () => {
    statusMessage.innerText = "⏳ 過去の得意先データを読み込み中...";
    try {
        const response = await fetch(GAS_URL);
        if (response.ok) {
            serverMasterData = await response.json();
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

// 出発ボタン
btnDeparture.addEventListener('click', () => {
    const now = new Date();
    reportData.departureTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🛫 出発時刻を記録しました (${now.toLocaleTimeString('ja-JP')})`;
});

// 帰庫ボタン
btnArrival.addEventListener('click', () => {
    const now = new Date();
    reportData.arrivalTime = now.toLocaleString('ja-JP');
    statusMessage.innerText = `🛬 帰庫時刻を記録しました (${now.toLocaleTimeString('ja-JP')})`;
});

// 保存ボタン
btnSave.addEventListener('click', async () => {
    reportData.driver = document.getElementById('driver').value;
    reportData.carNumber = document.getElementById('car-number').value;
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
        } else {
            statusMessage.innerText = "❌ 送信エラーが発生しました。";
        }
    } catch (error) {
        console.error(error);
        statusMessage.innerText = "❌ 接続に失敗しました。";
    }
});

// 💡 印刷ボタンを押したときの処理
btnPrint.addEventListener('click', () => {
    // スマホ・ブラウザ標準の印刷画面を呼び出す
    window.print();
});