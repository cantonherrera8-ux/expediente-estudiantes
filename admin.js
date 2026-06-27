// 1. SEGURIDAD: Verificar si el usuario está logueado y es Administrador
const sesion = JSON.parse(localStorage.getItem('usuario_logueado'));

if (!sesion || (sesion.rol !== 'admin' && sesion.rol !== 'super_admin')) {
    alert('Acceso denegado. Inicie sesión como Administrador.');
    window.location.href = 'index.html';
} else {
    document.getElementById('bienvenida-admin').innerText = `Panel Administrador: ${sesion.nombre}`;
}

// 2. OBTENER Y ENLISTAR LOS MAESTROS EN LA TABLA
async function cargarDocentes() {
    try {
        const respuesta = await fetch(`http://${window.location.hostname}:8080/api/docentes`);
        const docentes = await respuesta.json();
        
        const tbody = document.querySelector('#tabla-docentes tbody');
        tbody.innerHTML = ''; // Limpiar registros viejos

        docentes.forEach(docente => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${docente.nombre_completo}</strong></td>
                <td>${docente.usuario}</td>
                <td><span style="background:#e6f4ea; color:#137333; padding:4px 8px; border-radius:4px; font-size:0.85rem;">${docente.rol}</span></td>
                <td>
                    <button class="btn-eliminar" onclick="eliminarDocente('${docente.usuario}', '${docente.nombre_completo}')" style="background:#d73a49; color:white; border:none; padding:5px 10px; border-radius:4px; font-size:0.85rem; font-weight:bold; cursor:pointer;">
                        Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar la lista de docentes:', error);
    }
}

// 3. REGISTRAR UN NUEVO DOCENTE (Vinculado a los nuevos IDs)
document.getElementById('form-maestro').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita recargas inesperadas (y elimina el "?" molesto)

    const nombre = document.getElementById('nombre_completo').value;
    const usuario = document.getElementById('nuevo_usuario').value;
    const password = document.getElementById('nuevo_password').value;
    const msgRegistro = document.getElementById('msg-registro');

    try {
        const urlRegistro = `http://${window.location.hostname}:8080/api/docentes`;

        const respuesta = await fetch(urlRegistro, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: usuario,
                password: password,
                nombre_completo: nombre
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            alert(resultado.message || '¡Docente creado con éxito!');
            e.target.reset(); // Limpia los inputs del formulario
            cargarDocentes(); // Refresca la tabla automáticamente
        } else {
            alert(resultado.error || 'No se pudo crear la cuenta.');
        }
    } catch (error) {
        console.error('Error al conectar con la API de registro:', error);
        alert('Error de comunicación con el servidor. Verifica que Node.js esté corriendo.');
    }
});

// 4. ELIMINAR EL DOCENTE (Método POST seguro)
async function eliminarDocente(usuario, nombre) {
    const confirmar = confirm(`¿Está seguro de que desea revocar el acceso a: ${nombre}? \nEsta acción borrará sus credenciales.`);
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`http://${window.location.hostname}:8080/api/docentes/eliminar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: usuario })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            alert(resultado.message);
            cargarDocentes(); // Refrescar la lista de inmediato
        } else {
            alert(resultado.error || 'No se pudo eliminar al docente.');
        }
    } catch (error) {
        console.error('Error al conectar con la API:', error);
        alert('Error de conexión con el servidor.');
    }
}

// 5. CERRAR SESIÓN
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('usuario_logueado');
    window.location.href = 'index.html';
});

// Cargar la lista automáticamente al entrar a la pantalla
cargarDocentes();