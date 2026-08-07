/* 
 * R&B - Autenticación y Manejo de Sesiones
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value.trim();
            const btnLogin = document.getElementById('btn-login');
            const errorMessage = document.getElementById('error-message');

            errorMessage.classList.add('hidden');
            errorMessage.textContent = '';
            btnLogin.disabled = true;
            btnLogin.textContent = 'Ingresando...';

            // Mapeo automático de usuario simple a correo interno (@rb.com)
            const usernameClean = usernameInput.toLowerCase();
            const email = usernameClean.includes('@') 
                ? usernameClean 
                : `${usernameClean}@rb.com`;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: passwordInput
                });

                if (error) {
                    throw new Error('Usuario o contraseña incorrectos.');
                }

                // DNI o usuario del Administrador / Jefe
                const adminUsers = ['73248067', '73248067@rb.com', 'admin@rb.com'];

                if (adminUsers.includes(data.user.email) || adminUsers.includes(usernameClean)) {
                    // Redirige al Panel del Jefe
                    window.location.href = 'views/admin/dashboard.html';
                } else {
                    // Redirige a la vista Móvil de Vendedora
                    window.location.href = 'views/vendedora/inicio.html';
                }

            } catch (err) {
                errorMessage.textContent = err.message || 'Error de conexión al iniciar sesión.';
                errorMessage.classList.remove('hidden');
            } finally {
                btnLogin.disabled = false;
                btnLogin.textContent = 'Ingresar al Sistema';
            }
        });
    }
});

/**
 * Verifica la sesión activa en Supabase
 */
async function checkAuthSession() {
    if (typeof supabaseClient === 'undefined') return null;

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return null;
    }
}

/**
 * Cierra la sesión activa y regresa al Login
 */
async function logoutUser() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '../../index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}