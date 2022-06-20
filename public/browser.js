const config = {
    headers: {
        'content-type': 'application/json'
    }
}

document.addEventListener('click', function(event) {

    if(event.target.classList.contains('add_item')) {

        event.preventDefault();

        const todoText = document.getElementById('create_field');

        if(todoText.value === "")
            return;

        axios.post('/create-todo', JSON.stringify({
            todo: todoText.value
        }), config)
        .then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        })
    }

    if(event.target.classList.contains('edit-me')) {
        
        const todoId = event.target.getAttribute('data-id');
        const todoText = prompt("Enter you new todo text");
        
        axios.post('/edit-todo', JSON.stringify({
            todoId,
            todoText
        }), config).then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        })
    }

    if(event.target.classList.contains('delete-me')) {
        
        const todoId = event.target.getAttribute('data-id');
        
        axios.post('/delete-todo', JSON.stringify({
            todoId
        }), config).then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        })
    }
})

window.onload = function() {
    axios.post('/read-todo', JSON.stringify({}), config).then(res => {
        if(res.status !== 200) {
            alert('Failed to read todos. Please try again.');
            return;
        }

        const todoList = res.data.data;
        
        document.getElementById('item_list').insertAdjacentHTML('beforeend', todoList.map(item => {
            return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
                <span class="item-text"> ${item.todo} </span>
                <div>
                <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
                <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
        </li>`
        }).join(''))

    }).catch(err => {
        console.log(err);
        alert('Something went wrong. Unable to load todos.');
    })
}