$(async function () {
    const db = new Dexie('retro_emocoes');

    db.version(1).stores({
        emocoes: '++id, data, emocao'
    });

    db.open().catch(function (e) {
        console.error("DB open failed: " + e.stack);
    });

    let timer;
    const getAlert = function (erro) {

        return (erro ? $('#errAlert') : $('#okAlert'));
    }
    const removeAlert = function (erro) {
        const element = getAlert(erro);
        if (timer) clearTimeout(timer);
        element.text('').parent().addClass('hidden');
        element.parent().off('click');
    }
    const showAlert = function (text, erro) {
        const element = getAlert(erro);
        element.text(text).parent().removeClass('hidden');
        timer = setTimeout(removeAlert.bind(this), 3500);
        element.parent().on('click', function (e) {
            e.preventDefault();
            removeAlert(erro);
        });
    }

    if ($("#lista").length > 0) {
        const template = '<div class="collapse collapse-plus bg-base-100 my-8">\n' +
            '  <input type="checkbox" name="accordion-emocao" />\n' +
            '  <div class="collapse-title text-md font-semibold">{DATA} - {EMO}</div>\n' +
            '  <div class="collapse-content">\n' +
            '     <h3 class="font-semibold">Como estava quando senti?</h3>\n' +
            '     <p class="w-full">{ESTAVA}</p>\n' +
            '     <h3 class="font-semibold mt-4">O que senti no meu corpo?</h3>\n' +
            '     <p class="w-full">{SENTI}</p>\n' +
            '     <h3 class="font-semibold mt-4">O que pensei sobre mim?</h3>\n' +
            '     <p class="w-full">{PENSEI}</p>\n' +
            '     <div class="flex justify-end mt-8" data-ide="{IDE}">\n' +
            '       <button class="btn btn-primary mr-4 editar">Editar</button>\n' +
            '       <button class="btn btn-secondary apagar">Apagar</button>\n' +
            '     <div>\n' +
            '  </div>\n' +
            '</div>';

        const emocoes = await db.emocoes.reverse().sortBy('data');

        if (emocoes.length > 0) {
            $("#lista").html("");
        }
        else {
            $("#listaPlaceholder").removeClass("hidden");
        }

        emocoes.forEach((emo) => {
            $("#lista").append(
                template
                    .replace("{DATA}", emo.data.toISOString().replace('T', ' ').replace(/\:\d{2}\.\w+$/gm, ''))
                    .replace("{EMO}", emo.emocao)
                    .replace("{ESTAVA}", emo.estava)
                    .replace("{SENTI}", emo.senti)
                    .replace("{PENSEI}", emo.pensei)
                    .replace("{IDE}", emo.id)
            );
        });

        $("#lista").on('click', '.apagar', function (e) {
            e.preventDefault();

            if (confirm("Tem a certeza?")) {

            }
        });
    }

    if ($("#emoForm").length > 0) {
        const emoSel = $("#emocaoPrevia");
        const ide    = parseInt(window.location.hash.replace('#', ''));
        let emocoes  = await db.emocoes.reverse().sortBy('emocao');

        emocoes = emocoes.map(item => {
            return { cor: item.cor, emocao: item.emocao }
        }).reduce((acc, item) => {
            const parsed = JSON.stringify(item);
            if (!acc.has(parsed)) {
                acc.add(parsed);
            }

            return acc;
        }, new Set());

        emocoes.forEach(emo => {
            const parsed = JSON.parse(emo);
            emoSel.append(
                `<option data-cor="${parsed.cor}" data-emocao="${parsed.emocao}">${parsed.emocao}</option>`
            );
        });

        emoSel.on('change', function (e) {
            e.preventDefault();
            const self = $(this).find('option:selected');

            console.log(self.data('cor'));
            console.log(self.data('emocao'));

            $("#emocao").val(self.data('emocao'));
            $("#cor").val(self.data('cor'));
        });

        $("#emocao, #cor").on('change', function (e) {
            e.preventDefault();
            emoSel.val('-');
        });

        if (ide > 0) {
            $("#emoSelect, div.divider").hide();
            $("#imoInputs > label, #imoInputs > label > input").removeClass('max-w-xs');
            $("#editButtons").removeClass('hidden');
        }
        else {
            $("#newButtons").removeClass('hidden');
        }

        $("#emoForm").on('submit', async function (e) {
            e.preventDefault();
            let result, message = '';
            const formDataArray = await $(this).serializeArray().reduce((accumulator, value) => {
                accumulator[value.name] = value.value;
                return accumulator;
            }, {});

            if (ide > 0) {
                result  = await db.emocoes.update(ide, formDataArray);
                message = ((result === 0)
                    ? 'Ocorreu um erro'
                    : 'Emoção alterada com sucesso'
                );
            }
            else {
                formDataArray.data = new Date();
                result             = await db.emocoes.add(formDataArray);
                message            = ((result === 0)
                    ? 'Ocorreu um erro'
                    : 'Emoção adicionada com sucesso'
                );

                if (result === 1) $(this).reset();
            }

            showAlert(message, (result === 0));
        });
    }
});