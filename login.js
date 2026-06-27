// BUSCA EL EVENTO SUBMIT EN TU LOGIN.JS Y ASEGÚRATE DE QUE LA URL ESTÉ ASÍ:
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');

    try {
        // Usamos el puerto 8080 de forma dinámica con la IP actual
        const urlLogin = `http://${window.location.hostname}:8080/api/login`;

        const respuesta = await fetch(urlLogin, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario, password })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            // Guardar los datos de sesión correctamente
            localStorage.setItem('usuario_logueado', JSON.stringify({
                usuario: resultado.usuario,
                rol: resultado.rol,
                nombre: resultado.nombre
            }));

            // Redirección inteligente según el rol que configuramos
            if (resultado.rol === 'admin' || resultado.rol === 'super_admin') {
                window.location.href = 'admin.html';
            } else if (resultado.rol === 'docente') {
                window.location.href = 'expediente.html';
            }
        } else {
            // Mostrar error si las credenciales están mal
            mensajeError.innerText = resultado.error || 'Usuario o contraseña incorrectos.';
            mensajeError.style.display = 'block';
        }

    } catch (error) {
        console.error('Error en el login:', error);
        mensajeError.innerText = 'No se pudo conectar con el servidor. Verifica que esté encendido.';
        mensajeError.style.display = 'block';
    }
});