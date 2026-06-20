import './style.css'
import { supabase } from './supabase'

let carrito = []

document.querySelector('#app').innerHTML = `
  <nav>
    <button id="btnStock">Stock</button>
    <button id="btnVentas">Nueva Venta</button>
    <button id="btnHistorial">Historial</button>
    <button id="btnNuevoProducto">Nuevo Producto</button>
    <button id="btnNuevaVariante">Nueva Variante</button>
    <button id="btnDashboard">Dashboard</button>
  </nav>

  <main id="contenido"></main>
`

document.querySelector('#btnStock').addEventListener('click', cargarStock)
document.querySelector('#btnVentas').addEventListener('click', cargarVentas)
document.querySelector('#btnHistorial').addEventListener('click', cargarHistorial)
document.querySelector('#btnNuevoProducto').addEventListener('click', cargarNuevoProducto)
document.querySelector('#btnNuevaVariante').addEventListener('click', cargarNuevaVariante)
document.querySelector('#btnDashboard').addEventListener('click', cargarDashboard)

async function cargarStock() {

  const { data, error } = await supabase
    .from('variantesProducto')
    .select(`
      *,
      Productos (*),
      Colores (*),
      Talles (*)
    `)

  if (error) {
    console.error(error)
    return
  }

  const productosActivos = data.filter(
    v => v.Productos?.disponible === true
  )

  document.querySelector('#contenido').innerHTML = `
    <h1>Stock</h1>

    <div class="contenedor-productos">
      ${productosActivos.map(v => `
        <div class="card">

          <h2>${v.Productos?.nombre || ''}</h2>

          <p>Color: ${v.Colores?.nombre || ''}</p>

          <p>Talle: ${v.Talles?.nombre || ''}</p>

          <p>Stock: ${v.stock ?? 0}</p>

          <p>Precio: $${v.Productos?.precioVenta ?? 0}</p>

          <button
            class="btnEditarStock"
            data-id="${v.idVariante}"
            data-stock="${v.stock}"
          >
            Editar Stock
          </button>

          <button
            class="btnEditarPrecio"
            data-id="${v.Productos?.idProducto}"
            data-precio="${v.Productos?.precioVenta}"
          >
            Editar Precio
          </button>

        </div>
      `).join('')}
    </div>
  `

  document.querySelectorAll('.btnEditarStock').forEach(btn => {

    btn.addEventListener('click', async () => {

      const idVariante = Number(btn.dataset.id)
      const stockActual = Number(btn.dataset.stock)

      const nuevoStock = prompt(
        'Nuevo stock:',
        stockActual
      )

      if (nuevoStock === null) return

      const { error } = await supabase
        .from('variantesProducto')
        .update({
          stock: Number(nuevoStock)
        })
        .eq('idVariante', idVariante)

      if (error) {
        console.error(error)
        alert('Error al actualizar stock')
        return
      }

      cargarStock()

    })

  })
}

  document.querySelectorAll('.btnEditarPrecio').forEach(btn => {

    btn.addEventListener('click', async () => {

      const idProducto = Number(btn.dataset.id)
      const precioActual = Number(btn.dataset.precio)

      const nuevoPrecio = prompt(
        'Nuevo precio:',
        precioActual
      )

      if (nuevoPrecio === null) return

      const { error } = await supabase
        .from('Productos')
        .update({
          precioVenta: Number(nuevoPrecio)
        })
        .eq('idProducto', idProducto)

      if (error) {
        console.error(error)
        alert('Error al actualizar precio')
        return
      }

      cargarStock()

    })

  })





async function cargarVentas() {
  carrito = []

  const { data, error } = await supabase
    .from('variantesProducto')
    .select(`
      *,
      Productos (*),
      Colores (*),
      Talles (*)
    `)

  if (error) {
    console.error(error)
    return
  }

  document.querySelector('#contenido').innerHTML = `
    <h1>Nueva Venta</h1>

    <input
      id="buscadorProducto"
      type="text"
      placeholder="Buscar por producto, color, talle o SKU..."
    >

    <select id="selectProducto"></select>

    <input
      id="cantidad"
      type="number"
      min="1"
      value="1"
    >

    <button id="agregarCarrito">
      Agregar
    </button>

    <div id="carrito">
      <h2>Carrito</h2>
      <p>No hay productos agregados.</p>
    </div>

    <h3>Método de Pago</h3>

    <select id="metodoPago">
      <option value="Efectivo">Efectivo</option>
      <option value="Transferencia">Transferencia</option>
      <option value="Débito">Débito</option>
      <option value="Crédito">Crédito</option>
    </select>

    <br><br>

    <button id="finalizarVenta">
      Finalizar Venta
    </button>
  `

  const selectProducto = document.querySelector('#selectProducto')
  const buscadorProducto = document.querySelector('#buscadorProducto')

  function renderSelect(filtro = '') {
    const texto = filtro.toLowerCase()

    const filtrados = data.filter(v => {
      const nombre = v.Productos?.nombre?.toLowerCase() || ''
      const color = v.Colores?.nombre?.toLowerCase() || ''
      const talle = v.Talles?.nombre?.toLowerCase() || ''
      const sku = v.sku?.toLowerCase() || ''

      return (
        nombre.includes(texto) ||
        color.includes(texto) ||
        talle.includes(texto) ||
        sku.includes(texto)
      )
    })

    selectProducto.innerHTML = filtrados.map(v => `
      <option value="${v.idVariante}">
        ${v.Productos?.nombre || ''} -
        ${v.Colores?.nombre || ''} -
        ${v.Talles?.nombre || ''} -
        SKU: ${v.sku || ''} -
        Stock: ${v.stock}
      </option>
    `).join('')
  }

  renderSelect()

  buscadorProducto.addEventListener('input', () => {
    renderSelect(buscadorProducto.value)
  })

  document.querySelector('#agregarCarrito').addEventListener('click', () => {
    const idVariante = Number(document.querySelector('#selectProducto').value)
    const cantidad = Number(document.querySelector('#cantidad').value)

    const variante = data.find(v => v.idVariante === idVariante)

    if (!variante) {
      alert('Producto no encontrado')
      return
    }

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    if (cantidad > variante.stock) {
      alert('No hay suficiente stock disponible')
      return
    }

    carrito.push({
      idVariante,
      nombre: variante.Productos?.nombre || '',
      color: variante.Colores?.nombre || '',
      talle: variante.Talles?.nombre || '',
      precio: variante.Productos?.precioVenta || 0,
      cantidad,
      stockActual: variante.stock
    })

    mostrarCarrito()
  })

  document.querySelector('#finalizarVenta').addEventListener('click', finalizarVenta)
}

function mostrarCarrito() {
  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  )

  document.querySelector('#carrito').innerHTML = `
    <h2>Carrito</h2>

    ${carrito.length === 0 ? `
      <p>No hay productos agregados.</p>
    ` : `
      ${carrito.map((item, index) => `
        <div class="item-carrito">
          <p>
            ${item.nombre}
            ${item.color ? `- ${item.color}` : ''}
            ${item.talle ? `- ${item.talle}` : ''}
            x${item.cantidad}
            = $${item.precio * item.cantidad}
          </p>

          <button class="btnEliminar" data-index="${index}">
            Eliminar
          </button>
        </div>
      `).join('')}

      <h3>Total: $${total}</h3>
    `}
  `

  document.querySelectorAll('.btnEliminar').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.index)
      carrito.splice(index, 1)
      mostrarCarrito()
    })
  })
}

async function finalizarVenta() {
  if (carrito.length === 0) {
    alert('Carrito vacío')
    return
  }

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  )

  const metodoPago = document.querySelector('#metodoPago').value

  const { data: venta, error } = await supabase
    .from('Ventas')
    .insert({
      total,
      metodo_pago: metodoPago,
      estado: 'Completada',
      idCliente: null,
      observacion: null,
      fecha: new Date()
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    alert('Error al guardar la venta')
    return
  }

  for (const item of carrito) {
    await supabase
      .from('DetalleVentas')
      .insert({
        idVentas: venta.idVentas,
        idVariante: item.idVariante,
        cantidad: item.cantidad,
        precioUnitario: item.precio,
        subtotal: item.precio * item.cantidad
      })

    await supabase
      .from('variantesProducto')
      .update({
        stock: item.stockActual - item.cantidad
      })
      .eq('idVariante', item.idVariante)
  }

  carrito = []

  alert('Venta realizada correctamente')

  cargarVentas()
}

async function cargarHistorial() {
  const { data, error } = await supabase
    .from('Ventas')
    .select('*')
    .order('idVentas', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  document.querySelector('#contenido').innerHTML = `
    <h1>Historial de Ventas</h1>

    <div class="contenedor-productos">
      ${data.map(v => `
        <div class="card">
          <h2>Venta #${v.idVentas}</h2>
          <p>Fecha: ${new Date(v.fecha).toLocaleString()}</p>
          <p>Estado: ${v.estado}</p>
          <p>Método: ${v.metodo_pago}</p>
          <p>Total: $${v.total}</p>

          <button class="btnDetalle" data-id="${v.idVentas}">
            Ver detalle
          </button>
        </div>
      `).join('')}
    </div>
  `

  document.querySelectorAll('.btnDetalle').forEach(btn => {
    btn.addEventListener('click', () => {
      const idVenta = Number(btn.dataset.id)
      cargarDetalleVenta(idVenta)
    })
  })
}

async function cargarNuevoProducto() {

  const { data: categorias, error } = await supabase
    .from('Categorias')
    .select('*')
    .order('nombre')

  if (error) {
    console.error(error)
    return
  }

  document.querySelector('#contenido').innerHTML = `
    <h1>Nuevo Producto</h1>

    <input
      id="nombreProducto"
      type="text"
      placeholder="Nombre"
    >

    <input
      id="descripcionProducto"
      type="text"
      placeholder="Descripción"
    >

    <input
      id="precioProducto"
      type="number"
      placeholder="Precio"
    >

    <select id="categoriaProducto">
      ${categorias.map(c => `
        <option value="${c.idCategoria}">
          ${c.nombre}
        </option>
      `).join('')}
    </select>

    <button id="guardarProducto">
      Guardar Producto
    </button>
  `

  document
    .querySelector('#guardarProducto')
    .addEventListener('click', guardarProducto)
}
 

async function guardarProducto() {

  const nombre =
    document.querySelector('#nombreProducto').value

  const descripcion =
    document.querySelector('#descripcionProducto').value

  const precio =
    Number(document.querySelector('#precioProducto').value)

  const idCategoria =
    Number(document.querySelector('#categoriaProducto').value)

  if (!nombre) {
    alert('Ingresá un nombre')
    return
  }

  const { error } = await supabase
    .from('Productos')
    .insert({
      nombre,
      descripcion,
      precioVenta: precio,
      idCategoria,
      disponible: true
    })

  if (error) {
    console.error(error)
    alert(error.message)
    return
  }

  alert('Producto creado correctamente')

  

  cargarStock()
}

async function cargarNuevaVariante() {

  const { data: productos } = await supabase
    .from('Productos')
    .select('*')
    .order('nombre')

  const { data: colores } = await supabase
    .from('Colores')
    .select('*')
    .order('nombre')

  const { data: talles } = await supabase
    .from('Talles')
    .select('*')
    .order('orden')

  document.querySelector('#contenido').innerHTML = `
    <h1>Nueva Variante</h1>

    <select id="productoVariante">
      ${productos.map(p => `
        <option value="${p.idProducto}">
          ${p.nombre}
        </option>
      `).join('')}
    </select>

    <select id="colorVariante">
      ${colores.map(c => `
        <option value="${c.idColor}">
          ${c.nombre}
        </option>
      `).join('')}
    </select>

    <select id="talleVariante">
      ${talles.map(t => `
        <option value="${t.idTalle}">
          ${t.nombre}
        </option>
      `).join('')}
    </select>

    <input
      id="stockVariante"
      type="number"
      placeholder="Stock"
      min="0"
    >

    <input
      id="skuVariante"
      type="text"
      placeholder="SKU"
    >

    <button id="guardarVariante">
      Guardar Variante
    </button>
  `

  document
    .querySelector('#guardarVariante')
    .addEventListener('click', guardarVariante)
}

async function guardarVariante() {

  const idProducto =
    Number(document.querySelector('#productoVariante').value)

  const idColor =
    Number(document.querySelector('#colorVariante').value)

  const idTalle =
    Number(document.querySelector('#talleVariante').value)

  const stock =
    Number(document.querySelector('#stockVariante').value)

  const sku =
    document.querySelector('#skuVariante').value

  const { error } = await supabase
    .from('variantesProducto')
    .insert({
      idProducto,
      idColor,
      idTalle,
      stock,
      sku
    })

  if (error) {
    console.error(error)
    alert(error.message)
    return
  }

  alert('Variante creada correctamente')

  cargarStock()
}



async function cargarDetalleVenta(idVenta) {
  const { data, error } = await supabase
    .from('DetalleVentas')
    .select(`
      *,
      variantesProducto (
        *,
        Productos (*),
        Colores (*),
        Talles (*)
      )
    `)
    .eq('idVentas', idVenta)

  if (error) {
    console.error(error)
    return
  }

  document.querySelector('#contenido').innerHTML = `
    <h1>Detalle Venta #${idVenta}</h1>

    <button id="volverHistorial">
      Volver al historial
    </button>

    <div class="contenedor-productos">
      ${data.map(d => `
        <div class="card">
          <h2>${d.variantesProducto?.Productos?.nombre || ''}</h2>
          <p>Color: ${d.variantesProducto?.Colores?.nombre || ''}</p>
          <p>Talle: ${d.variantesProducto?.Talles?.nombre || ''}</p>
          <p>Cantidad: ${d.cantidad}</p>
          <p>Precio unitario: $${d.precioUnitario}</p>
          <p>Subtotal: $${d.subtotal}</p>
        </div>
      `).join('')}
    </div>
  `

  document
    .querySelector('#volverHistorial')
    .addEventListener('click', cargarHistorial)
}


async function cargarDashboard() {
  const hoy = new Date().toISOString().split('T')[0]

  const { data: ventas } = await supabase
    .from('Ventas')
    .select('*')
    .gte('fecha', hoy)

  const { data: variantes } = await supabase
    .from('variantesProducto')
    .select('stock')

  const ventasHoy = ventas.length

  const facturacionHoy = ventas.reduce(
    (acc, venta) => acc + Number(venta.total),
    0
  )

  const productosEnStock = variantes.reduce(
    (acc, item) => acc + Number(item.stock),
    0
  )

  document.querySelector('#contenido').innerHTML = `
    <h1>Dashboard</h1>

    <div class="contenedor-productos">
      <div class="card">
        <h2>Ventas hoy</h2>
        <p>${ventasHoy}</p>
      </div>

      <div class="card">
        <h2>Facturación hoy</h2>
        <p>$${facturacionHoy}</p>
      </div>

      <div class="card">
        <h2>Productos en stock</h2>
        <p>${productosEnStock}</p>
      </div>
    </div>
  `
}


cargarDashboard()