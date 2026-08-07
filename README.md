# R.O.S.S.Y - Sistema de Gestión Comercial y Facturación

Sistema de gestión comercial, control de inventario y facturación electrónica adaptado a la normativa de SUNAT (Perú). Diseñado para la administración centralizada de inventarios, ventas, compras, movimientos de caja, auditoría y reportes estadísticos.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Base de Datos & Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions)
- **Gráficos & Visualizaciones:** [Chart.js](https://www.chartjs.org/)
- **Facturación & Clientes:** Servicios web / APIs para consulta de DNI/RUC y emisión de comprobantes SUNAT (Boletas / Facturas).

---

## 📂 Estructura del Proyecto

```text
/
├── css/
│   └── admin.css            # Estilos globales y componentes del panel administrativo
├── js/
│   └── admin/
│       ├── inventario.js    # Gestión de productos, stock y categorías
│       ├── ventas.js        # Historial de ventas, utilidades y estado SUNAT
│       ├── compras.js       # Registro de compras y control de proveedores
│       ├── clientes.js      # Directorio de clientes e historial comercial
│       ├── proveedores.js   # Directorio de proveedores y talleres
│       ├── caja.js         # Arqueo de caja, ingresos, egresos y saldos
│       ├── reportes.js      # Métricas dinámicas y gráficos con Chart.js
│       ├── sunat.js         # Validaciones DNI/RUC y payload de comprobantes
│       ├── usuarios.js      # Administración de usuarios y permisos
│       ├── configuracion.js # Datos de empresa, IGV y correlativos
│       ├── auditoria.js     # Trazabilidad de eventos y exportación de logs
│       └── notifications.js # Alertas flotantes (Toasts) y avisos de stock bajo
├── .gitignore
└── README.md