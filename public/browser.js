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
        }), config).then(res => {
            console.log(res);
        }).catch(err => {
            console.log(err);
        })

    }
})