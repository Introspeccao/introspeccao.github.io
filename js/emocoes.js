$(function () {
    const db = new Dexie('retro_emocoes');

    db.version(1).stores({
        emocoes: '++id, data, emocao'
    });

    if ($("#lista").length > 0) {
        $("#lista").html("");

        const template = '<div class="collapse collapse-plus bg-base-100 mb-4">\n' +
            '  <input type="checkbox" name="accordion-emocao" />\n' +
            '  <div class="collapse-title text-md font-semibold">2024-07-11 12:05 - Alegria</div>\n' +
            '  <div class="collapse-content">\n' +
            '    <p>hello</p>\n' +
            '  </div>\n' +
            '</div>';

        for (let i = 1; i <= 5; i++) {
            $("#lista").prepend(template);
        }
    }

    if ($("#emoForm").length > 0) {
        const ide = parseInt(window.location.hash.replace('#', ''))

        if (ide > 0) {
            $("#emoSelect, div.divider").hide();
            $("#imoInputs > label, #imoInputs > label > input").removeClass('max-w-xs');
            $("#editButtons").removeClass('hidden');
        }
        else {
            $("#newButtons").removeClass('hidden');
        }
    }
});