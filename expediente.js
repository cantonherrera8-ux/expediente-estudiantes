// 1. SEGURIDAD: Verificar que haya una sesión activa (Docente o Administrador)
const sesion = JSON.parse(localStorage.getItem('usuario_logueado'));

if (!sesion) {
    alert('Acceso denegado. Inicie sesión.');
    window.location.href = 'index.html';
} else {
    const contenedorBienvenida = document.getElementById('bienvenida-docente');
    if (contenedorBienvenida) {
        contenedorBienvenida.innerText = `Portal del Docente: ${sesion.nombre || sesion.usuario}`;
    }
}

// CONFIGURACIÓN DE LA URL DEL BACKEND
const obtenerUrlBaseBackend = () => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return `http://127.0.0.1:8080`;
    }
    return `http://${host}:8080`;
};

// 2. CARGAR LOS EXPEDIENTES DESDE EL BACKEND
async function cargarExpedientes() {
    try {
        const respuesta = await fetch(`${obtenerUrlBaseBackend()}/api/estudiantes`);
        if (!respuesta.ok) throw new Error('Error al obtener datos');
        
        const estudiantes = await respuesta.json();
        const tbody = document.querySelector('#tabla-estudiantes tbody');
        
        if (tbody) {
            tbody.innerHTML = ''; 

            estudiantes.forEach(alumno => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><strong>${alumno.nombre}</strong></td>
                    <td>${alumno.edad} años</td>
                    <td><span style="background: #edf2f7; color: #2d3748; padding: 3px 8px; border-radius: 4px; font-size: 0.9rem;">${alumno.grado}</span></td>
                    <td style="color: #4a5568; font-size: 0.95rem;">${alumno.observaciones || 'Sin observaciones'}</td>
                `;
                tbody.appendChild(fila);
            });
        }
        const msgEstudiante = document.getElementById('msg-estudiante');
        if (msgEstudiante) msgEstudiante.style.display = 'none';
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
}

// 3. REGISTRAR UN NUEVO ESTUDIANTE (SOLUCIÓN ABSOLUTA E INMUNE A IDs O TIPOS DE ELEMENTOS)
document.getElementById('form-estudiante').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    // Extraemos todos los elementos interactivos del formulario en orden real
    const elementos = Array.from(e.target.elements).filter(el => 
        el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
    );

    // Mapeo directo por posición física real de los contenedores visibles en la imagen
    const nombreVal = elementos[0] ? elementos[0].value.trim() : '';
    const edadVal = elementos[1] ? parseInt(elementos[1].value, 10) : 0;
    const gradoVal = elementos[2] ? elementos[2].value.trim() : '';
    const observacionesVal = elementos[3] ? elementos[3].value.trim() : '';

    const msgEstudiante = document.getElementById('msg-estudiante');

    // Validación en el cliente antes del envío
    if (!nombreVal || !edadVal || !gradoVal) {
        if (msgEstudiante) {
            msgEstudiante.innerText = 'Por favor, rellene todos los campos obligatorios.';
            msgEstudiante.style.backgroundColor = '#fde8e8';
            msgEstudiante.style.color = '#9b1c1c';
            msgEstudiante.style.display = 'block';
        }
        return;
    }

    try {
        const respuesta = await fetch(`${obtenerUrlBaseBackend()}/api/estudiantes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreVal,                       
                edad: edadVal,
                grado: gradoVal,
                observaciones: observacionesVal
            })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.success) {
            alert(resultado.message || '¡Expediente guardado con éxito!');
            e.target.reset(); 
            if (msgEstudiante) msgEstudiante.style.display = 'none';
            cargarExpedientes(); // Recargar la lista inmediatamente en pantalla
        } else {
            console.error('Error reportado por base de datos:', resultado.detalles);
            throw new Error(resultado.error || 'Error interno');
        }

    } catch (error) {
        console.error('Error en la comunicación HTTP:', error);
        if (msgEstudiante) {
            msgEstudiante.innerText = 'Error al guardar. Verifica que los campos sean válidos.';
            msgEstudiante.style.backgroundColor = '#fde8e8';
            msgEstudiante.style.color = '#9b1c1c';
            msgEstudiante.style.padding = '10px';
            msgEstudiante.style.marginTop = '10px';
            msgEstudiante.style.borderRadius = '6px';
            msgEstudiante.style.textAlign = 'center';
            msgEstudiante.style.display = 'block';
        }
    }
});

// 4. CERRAR SESIÓN
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('usuario_logueado');
        window.location.href = 'index.html';
    });
}

// Carga inicial
cargarExpedientes();