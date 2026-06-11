// Подключаем Firebase напрямую из CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// КОНФИГУРАЦИЯ: Вставь сюда свою ссылку из Firebase
const firebaseConfig = {
    databaseURL: "https://physio-cube-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const used = {}; // Блокировка повторных кликов

const el = id => document.getElementById(id);

// ─── ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ────────────────────────
function updateUI(postId, data) {
    if (!data) return;

    // Обновляем просмотры
    const viewsEl = el(`v-${postId}`);
    if (viewsEl) viewsEl.textContent = data.views || 0;

    // Обновляем реакции
    ['like', 'fire', 'clap', 'heart'].forEach(emoji => {
        const countEl = el(`rc-${postId}-${emoji}`);
        if (countEl) {
            countEl.textContent = (data.reactions && data.reactions[emoji]) || 0;
        }
    });
}

// ─── СЛУШАТЕЛЬ ДАННЫХ (Realtime) ──────────────────
// Эта функция сама обновит цифры на странице, когда кто-то другой кликнет
const postRef = ref(db, 'stats/post-0');
onValue(postRef, (snapshot) => {
    updateUI(0, snapshot.val());
});

// ─── СЧЕТЧИК ПРОСМОТРОВ ───────────────────────────
async function trackView() {
    if (!sessionStorage.getItem('viewed_0')) {
        sessionStorage.setItem('viewed_0', '1');
        const viewsRef = ref(db, 'stats/post-0/views');

        // Используем транзакцию, чтобы счетчик не сбивался при одновременных заходах
        runTransaction(viewsRef, (current) => (current || 0) + 1);
    }
}

// ─── ФУНКЦИЯ РЕАКЦИИ ──────────────────────────────
window.react = function (postId, emoji) {
    const key = `${postId}-${emoji}`;
    if (used[key]) return; // Защита от спама кликами
    used[key] = true;

    const btn = el(`rb-${postId}-${emoji}`);
    btn?.classList.add('active');

    const reactionRef = ref(db, `stats/post-${postId}/reactions/${emoji}`);

    // Атомарное увеличение на +1
    runTransaction(reactionRef, (current) => (current || 0) + 1)
        .catch(() => {
            // Если ошибка — возвращаем кнопку в исходное состояние
            used[key] = false;
            btn?.classList.remove('active');
        });
};

// Запуск
trackView();