const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getCurrentUser() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    } catch (err) {
        console.error('Error getting current user:', err);
        return null;
    }
}


async function requireAuth() {
    const user = await getCurrentUser();
    
    if (!user) {
        // Если пользователь не авторизован - редирект на логин
        window.location.href = '/pages/auth/login.html';
        return false;
    }
    
    return true;
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            alert('Error logging out');
            return false;
        }
        
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('uid');
        window.location.href = '/pages/auth/login.html';
        return true;
    } catch (err) {
        console.error('Unexpected error:', err);
        return false;
    }
}

async function getCurrentUserEmail() {
    const user = await getCurrentUser();
    return user?.email || null;
}

async function getCurrentUserId() {
    const user = await getCurrentUser();
    return user?.id || null;
}


async function getUserData(tableName) {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching data:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Unexpected error:', err);
        return null;
    }
}

async function addRecord(tableName, record) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            console.error('User not authenticated');
            return null;
        }

        const recordWithUser = {
            ...record,
            user_id: user.id
        };

        const { data, error } = await supabase
            .from(tableName)
            .insert([recordWithUser])
            .select();

        if (error) {
            console.error('Error adding record:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Unexpected error:', err);
        return null;
    }
}

// Обновить запись
async function updateRecord(tableName, recordId, updates) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .update(updates)
            .eq('id', recordId)
            .select();

        if (error) {
            console.error('Error updating record:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('Unexpected error:', err);
        return null;
    }
}

// Удалить запись
async function deleteRecord(tableName, recordId) {
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', recordId);

        if (error) {
            console.error('Error deleting record:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('Unexpected error:', err);
        return false;
    }
}

function subscribeToTable(tableName, callback) {
    const subscription = supabase
        .channel(`public:${tableName}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return subscription;
}

// Отписаться от обновлений
async function unsubscribeFromTable(subscription) {
    await supabase.removeChannel(subscription);
}

window.supabaseHelper = {
    getCurrentUser,
    getCurrentUserEmail,
    getCurrentUserId,
    requireAuth,
    signOut,
    getUserData,
    addRecord,
    updateRecord,
    deleteRecord,
    subscribeToTable,
    unsubscribeFromTable,
    supabase // сам объект supabase для продвинутых операций
};
