# The Wyldrift Storefront

Run the local backend and storefront:

```powershell
node server.js
```

Open:

- Storefront: `http://localhost:8080`
- Admin panel: `http://localhost:8080/admin.html`

The WhatsApp Business number is set in `script.js`:

```js
const WHATSAPP_BUSINESS_NUMBER = "918219672237";
```

Products are saved in `db.json`. Use the admin panel to add products, update names, prices, stock, images, details, and hide or show products on the storefront.
