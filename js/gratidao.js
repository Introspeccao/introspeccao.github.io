$(function() {
    const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    });
    const icon = '<svg class="h-8 w-auto fill-slate-400 remove" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M11.188 4.781c6.188 0 11.219 5.031 11.219 11.219s-5.031 11.188-11.219 11.188-11.188-5-11.188-11.188 5-11.219 11.188-11.219zM11.25 17.625l3.563 3.594c0.438 0.438 1.156 0.438 1.594 0 0.406-0.406 0.406-1.125 0-1.563l-3.563-3.594 3.563-3.594c0.406-0.438 0.406-1.156 0-1.563-0.438-0.438-1.156-0.438-1.594 0l-3.563 3.594-3.563-3.594c-0.438-0.438-1.156-0.438-1.594 0-0.406 0.406-0.406 1.125 0 1.563l3.563 3.594-3.563 3.594c-0.406 0.438-0.406 1.156 0 1.563 0.438 0.438 1.156 0.438 1.594 0z"></path>'
        + '</svg>';

    $('#add').on('click', function(e) {
        e.preventDefault();

        Swal.fire({
            title: "De que sente grato?",
            icon: "question",
            input: "text",
            inputAttributes: {
                required: true
            },
            showCancelButton: true,
            confirmButtonText: "Adicionar",
            cancelButtonText: "Cancelar",
        }).then((result) => {
            if (result.value) {
                $('#listaPlaceholder').addClass('hidden');
                $('#listaGrat').append('<li>' + result.value + icon + ' </li>');
            }
        });
    });

    $('#removeAll').on('click', function(e) {
        e.preventDefault();

        $('#listaGrat').html('');
        $('#listaPlaceholder').removeClass('hidden');
    });

    $('#listaGrat').on('click', '.remove', function(e) {
        e.preventDefault();

        e.target.closest('li').remove();

        if ($('#listaGrat > li').length === 0) $('#listaPlaceholder').removeClass('hidden');
    });
});