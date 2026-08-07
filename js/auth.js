/* 
 * R&B - Autenticación y Manejo de Sesión (Supabase)
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

            // Ocultar mensajes previos y deshabilitar botón durante el proceso
            errorMessage.classList.add('hidden');
            errorMessage.textContent = '';
            btnLogin.disabled = true;
            btnLogin.textContent = 'Ingresando...';

            // Mapeo automático de usuario simple (ej: "ryb") a correo interno ("ryb@rb.com")
            const email = usernameInput.includes('@') 
                ? usernameInput 
                : `${usernameInput.toLowerCase()}@rb.com`;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: passwordInput
                });

                if (error) {
                    throw new Error('Usuario o contraseña incorrectos.');
                }

                // Redirección inmediata a la interfaz de la vendedora
                window.location.href = 'views/vendedora/inicio.html';

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
 * Cierra la sesión activa y regresa a la pantalla de Login
 */
async function logoutUser() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = '../../index.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}