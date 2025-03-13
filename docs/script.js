let inventory = JSON.parse(localStorage.getItem("inventory")) || {};
let history = JSON.parse(localStorage.getItem("history")) || [];

$(document).ready(function () {
    $('#inventoryTable').DataTable({
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
        },
        "columnDefs": [
            {
                "width": "10%",
                "targets": 0
            },
            {
                "width": "20%",
                "targets": 1
            },
            {
                "width": "15%",
                "targets": 2
            },
            {
                "width": "30%",
                "targets": 3
            }
        ]
    });
    $('#historyTable').DataTable({
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
        }
    });
});
function exportCSV() {
    const inventoryData = Object.values(inventory).map(item => ({
        Código: item.code,
        Nome: item.name,
        Quantidade: item.quantity
    }));

    const header = ['Código', 'Nome', 'Quantidade'];
    const rows = inventoryData.map(item => [item.Código, item.Nome, item.Quantidade]);

    let csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "estoque.csv");
    link.click();
}

function addItem() {
    const code = document.getElementById("productCode").value;
    const name = document.getElementById("itemName").value;
    const quantity = parseInt(document.getElementById("itemQuantity").value);
    const responsible = document.getElementById("responsiblePerson").value;

    if (!code || !name || !quantity || !responsible) {
        showSweetAlert('Por favor, preencha todos os campos!', 'error');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        showSweetAlert('A quantidade deve ser um número maior que zero!', 'error');
        return;
    }

    const codeExists = inventory[code] !== undefined;
    const nameExists = Object.values(inventory).some(item => item.name.toLowerCase() ===
        name.toLowerCase());

    if (codeExists || nameExists) {
        showSweetAlert('Produto já cadastrado com o mesmo código ou nome!', 'error');
        return;
    }

    inventory[code] = {
        name,
        quantity,
        responsible
    };
    addHistory(code, name, "Entrada", quantity, responsible);
    saveData();
    updateTable();
    clearInputFields();
    showSweetAlert('Produto cadastrado com sucesso!', 'success');
    $('#inventoryTable').DataTable().draw();
}

function addHistory(code, name, type, quantity, responsible) {
    const date = new Date().toISOString();
    history.push({
        code,
        name,
        type,
        quantity,
        responsible,
        date
    });
    saveData();
    updateHistoryTable();
    $('#historyTable').DataTable().draw();
}

function saveData() {
    localStorage.setItem("inventory", JSON.stringify(inventory));
    localStorage.setItem("history", JSON.stringify(history));
}

function updateTable() {
    const inventoryBody = document.getElementById("inventoryBody");
    inventoryBody.innerHTML = "";

    for (const code in inventory) {
        if (inventory.hasOwnProperty(code)) {
            const item = inventory[code];
            const row = document.createElement("tr");

            let quantityDisplay = item.quantity.toString();

            if (item.quantity < 20) {
                quantityDisplay += ' <span class="badge badge-warning">Baixo Estoque</span>';
            }

            row.innerHTML = `
                <td>${code}</td>
                <td>${item.name}</td>
                <td>${quantityDisplay}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="updateQuantity('${code}', 'Entrada')"><i class="fas fa-plus icon"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="updateQuantity('${code}', 'Saída')"><i class="fas fa-minus icon"></i></button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteItem('${code}')"><i class="fas fa-trash icon"></i></button>
                </td>
            `;

            inventoryBody.appendChild(row);
        }
    }
}

function deleteItem(code) {
    const itemName = inventory[code].name;
    Swal.fire({
        title: `Tem certeza que deseja excluir "${itemName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            delete inventory[code];
            addHistory(code, itemName, "Exclusão", 0, "Usuário");
            saveData();
            updateTable();
            showSweetAlert(`${itemName} foi excluído do estoque!`, 'success');
            $('#inventoryTable').DataTable().draw();
        }
    })
}

function updateQuantity(code, type) {
    const itemName = inventory[code].name;
    Swal.fire({
        title: `Digite a quantidade de ${type.toLowerCase()} para o item ${itemName}:`,
        input: 'number',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        cancelButtonText: 'Cancelar',
    }).then((result) => {
        if (result.isConfirmed) {
            const quantity = parseInt(result.value);

            if (isNaN(quantity) || quantity <= 0) {
                showSweetAlert("A quantidade deve ser um número maior que zero.", 'error');
                return;
            }

            if (type === "Saída" && inventory[code].quantity < quantity) {
                showSweetAlert("Quantidade insuficiente em estoque.", 'error');
                return;
            }

            inventory[code].quantity += (type === "Entrada" ? quantity : -quantity);
            const responsible = "Usuário";
            addHistory(code, itemName, type, quantity, responsible);
            saveData();
            updateTable();
            showSweetAlert(`Quantidade de ${itemName} atualizada com sucesso!`, 'success');
            $('#inventoryTable').DataTable().draw();
        }
    });
}

function updateHistoryTable() {
    const historyBody = document.getElementById("historyBody");
    historyBody.innerHTML = "";
    for (const item of history) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.quantity}</td>
            <td>${item.responsible}</td>
            <td>${new Date(item.date).toLocaleString()}</td>
        `;
        historyBody.appendChild(row);
    }
}

function showSweetAlert(message, icon) {
    Swal.fire({
        title: message,
        icon: icon,
        timer: 2000,
        showConfirmButton: false,
        animation: true,
        customClass: {
            popup: 'animated zoomIn'
        }
    });
}

function clearInputFields() {
    document.getElementById("productCode").value = "";
    document.getElementById("itemName").value = "";
    document.getElementById("itemQuantity").value = "";
    document.getElementById("responsiblePerson").value = "Jefferson Jesus";
}

function exportData() {
    const data = {
        inventory: JSON.parse(localStorage.getItem("inventory")) || {},
        history: JSON.parse(localStorage.getItem("history")) || []
    };
    const json = JSON.stringify(data);
    const blob = new Blob([json], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "estoque_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);

                if (data.inventory) {
                    localStorage.setItem("inventory", JSON.stringify(data.inventory));
                    inventory = data.inventory;
                }
                if (data.history) {
                    localStorage.setItem("history", JSON.stringify(data.history));
                    history = data.history;
                }

                updateTable();
                updateHistoryTable();
                showSweetAlert('Dados importados com sucesso!', 'success');

            } catch (error) {
                showSweetAlert('Erro ao importar dados: Formato JSON inválido', 'error');
                console.error("Erro ao importar dados:", error);
            }
        }

        reader.readAsText(file);
    }

    input.click();
}

updateTable();
updateHistoryTable();
