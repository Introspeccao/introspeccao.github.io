$(async function () {
    const db = new Dexie('retro_emocoes');

    db.version(1).stores({
        emocoes: '++id, data, emocao'
    });

    db.open().catch(function (e) {
        console.error("DB open failed: " + e.stack);
    });

    let timer;
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
    const ide   = parseInt(window.location.hash.replace('#', ''));

    if ($("#lista").length > 0) {
        const template = '<div id="emo{IDE}" class="collapse collapse-plus bg-base-100 my-8">\n' +
            '  <input type="checkbox" name="accordion-emocao" />\n' +
            '  <div class="collapse-title text-md font-semibold">{DATA} - {EMO}</div>\n' +
            '  <div class="collapse-content">\n' +
            '     <h3 class="font-semibold">Como estava quando senti?</h3>\n' +
            '     <p class="w-full">{ESTAVA}</p>\n' +
            '     <h3 class="font-semibold mt-6">O que senti no meu corpo?</h3>\n' +
            '     <p class="w-full">{SENTI}</p>\n' +
            '     <h3 class="font-semibold mt-6">O que pensei sobre mim?</h3>\n' +
            '     <p class="w-full">{PENSEI}</p>\n' +
            '     <h3 class="font-semibold mt-6">Cor associada:</h3>\n' +
            '     <span class="cor-lista mt-2 w-full md:w-80 h-10 rounded-md block" style="background-color: {COR};"></span>\n' +
            '     <div class="flex justify-end mt-8" data-ide="{IDE}">\n' +
            '       <button class="btn btn-secondary mr-4 apagar">Apagar</button>\n' +
            '       <button class="btn btn-primary editar">Editar</button>\n' +
            '     <div>\n' +
            '  </div>\n' +
            '</div>';

        const emocoes = await db.emocoes.reverse().sortBy('data');

        if (emocoes.length > 0) {
            $("#lista").html("");
        }
        else {
            $("#listaPlaceholder").removeClass("hidden");
            $("#removeAll, #export").parent().hide();
        }

        await emocoes.forEach((emo) => {
            $("#lista").append(
                template
                    .replace(/{DATA}/g, emo.data.toISOString().replace('T', ' ').replace(/\:\d{2}\.\w+$/gm, ''))
                    .replace(/{EMO}/g, emo.emocao)
                    .replace(/{ESTAVA}/g, emo.estava)
                    .replace(/{SENTI}/g, emo.senti)
                    .replace(/{PENSEI}/g, emo.pensei)
                    .replace(/{IDE}/g, emo.id)
                    .replace(/{COR}/g, emo.cor)
            );
        });

        $("#lista").on('click', '.apagar', function (e) {
            e.preventDefault();
            const self = $(e.target).parent();
            const ide  = self.data('ide');

            Swal.fire({
                title: "Tem a certeza?",
                text: "Irá apagar o registo definitivamente",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Apagar",
                cancelButtonText: "Cancelar"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const deleteCount = await db.emocoes.where("id").equals(ide).delete();
                    if (deleteCount > 0)  {
                        self.parent().parent().hide();
                    }
                    else {
                        Toast.fire({
                            icon: "error",
                            title: "Ocorreu um erro ao apagar o registo"
                        });
                    }
                }
            });
        });
        $("#lista").on('click', '.editar', function (e) {
            e.preventDefault();
            const ide            = $(e.target).parent().data('ide');
            window.location.href = "/emocao.html#" + String(ide);
        });

        if (ide > 0) {
            $("#emo" + String(ide)).find('input[type="checkbox"]').prop('checked', true);

            $('html, body').animate({
                scrollTop: $("#emo" + String(ide)).find('input[type="checkbox"]').offset().top
            }, 400);
        }

        $("#removeAll").on("click", function (e) {
            e.preventDefault();

            Swal.fire({
                title: "Tem a certeza?",
                text: "Irá apagar TODOS os registos definitivamente",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Apagar",
                cancelButtonText: "Cancelar"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await db.emocoes.clear();
                    window.location.reload();
                }
            });
        });
        $("#export").on("click", function (e) {
            e.preventDefault();

        });
    }

    if ($("#emoForm").length > 0) {
        const emoSel = $("#emocaoPrevia");
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
            $("#emocao").val(self.data('emocao'));
            $("#cor").val(self.data('cor'));
        });

        $("#emocao, #cor").on('change', function (e) {
            e.preventDefault();
            emoSel.val('-');
        });

        if (ide > 0) {
            $("#imoInputs > label, #imoInputs > label > input").removeClass('max-w-xs');
            $("#editButtons").removeClass('hidden');

            //load dos dados
            const emocao = await db.emocoes.where("id").equals(ide).toArray();
            $("#emocao").val(emocao[0].emocao);
            $("#cor").val(emocao[0].cor);
            $("#estava").val(emocao[0].estava);
            $("#senti").val(emocao[0].senti);
            $("#pensei").val(emocao[0].pensei);

            $("#remover").on('click', function (e) {
                e.preventDefault();

                Swal.fire({
                    title: "Tem a certeza?",
                    text: "Irá apagar o registo definitivamente",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                    confirmButtonText: "Apagar",
                    cancelButtonText: "Cancelar"
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const deleteCount = await db.emocoes.where("id").equals(ide).delete();
                        if (deleteCount > 0)  {
                            window.location.href = '/emocoes.html';
                        }
                        else {
                            Toast.fire({
                                icon: "error",
                                title: "Ocorreu um erro ao apagar o registo"
                            });
                        }
                    }
                });
            });
            $("#voltar").attr('href', $("#voltar").attr('href') + "#" + String(ide));
        }
        else {
            $("#newButtons").removeClass('hidden');

            if (emocoes.size > 0) {
                $("#emoSelect, div.divider").removeClass('hidden');
            }
        }

        $("#emoForm").on('submit', async function (e) {
            e.preventDefault();
            let result, message = '';
            const self = $(this);
            const formDataArray = await self.serializeArray().reduce((accumulator, value) => {
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

                if (result !== 0) {
                    window.location.href = '/emocoes.html#' + String(result);
                }
            }

            Toast.fire({
                icon: (result === 0 ? "error" : "success") ,
                title: message
            });
        });
    }
});