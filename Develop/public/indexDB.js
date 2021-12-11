let db;

const indexDB =
    window.indexDB ||
    window.mozIndexDB ||
    window.webkitIndexDB ||
    window.msIndexDB ||
    window.shimIndexDB;

const request = indexDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;

    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    console.log("in indexDB.js / saveRecord ---------------------" + record);
    const transaction = db.transaction(["pending"], "readwrite");
    console.log("in indexDB.js / saveRecord / transaction ----------------" + transaction);
    const store = transaction.objectStore("pending");
    store.add(record);
}

function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    console.log("in indexDB.js / checkDatabase / transaction ----------------" + transaction);
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}

// event listener for when app comes back online
window.addEventListener("online", checkDatabase);