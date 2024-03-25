const { firefox } = require('playwright');

require('dotenv').config();

const processos = ["08051629520154058000"];

(async () => {

  console.log("Instanciando o firefox ...");

  const headless = process.env.HEADLESS === 'true';
  const browser = await firefox.launch({ headless: headless }); 

  console.log("Abrindo uma nova página ...");
  const page = await browser.newPage();

  page.on('close', () => console.log('A aba foi fechada.'));
  page.on('load', async () => {
    console.log('Página completamente carregada.');
    const url = page.url();
    console.log(`URL da aba: ${url}`);
  });
  page.on('popup', popupPage => console.log(`Nova aba aberta com URL: ${popupPage.url()}`));
  page.on('request', request => console.log(`Requisição feita para: ${request.url()}`));
  page.on('response', async response => {
    console.log(`Recebido resposta de: ${response.url()}`);

    if (response !== null && response.status() === 200) {
      try {
        const responseBody = await response.text();
      } catch (error) {
        console.error('Erro ao ler o corpo da resposta:', error);
      }
    }
  });

  page.on('download', async (download) => {
    const downloadUrl = download.url();
    const filePath = await download.path();
    console.log(`Downloaded file from ${downloadUrl} to ${filePath}`);
});

  page.on('framenavigated', async () => {
    const currentUrl = page.url();
    console.log(`Navegou para: ${currentUrl}`);

    if (currentUrl !== 'about:blank') {
      console.log(`URL final da aba: ${currentUrl}`);
    }
  });

  console.log("Navegando para a página do JFAL ...")
  await page.goto('https://pje.jfal.jus.br/pje/login.seam');
  
  console.log("Clicando no botão 'PjeOffice' para usar o PJe ...")
  const btnUtilizarApplet = page.locator('#btnUtilizarApplet', { state: 'attached' });
  await btnUtilizarApplet.waitFor();
  await btnUtilizarApplet.click('#btnUtilizarApplet');

  console.log("Aguardando a verificação do ambiente ...")
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  await delay(5000); 

  await page.screenshot({ path: './screenshots/screenshot01.png' });

  console.log("Clicando no botão 'Fechar', após verificação do ambiente ...")
  const btnfechar = page.locator('#btnfechar', { state: 'attached' }).nth(2);
  await btnfechar.waitFor();
  await btnfechar.click();

  console.log("Clicando no botão 'Entrar' para logar")
  const loginAplicacaoButton = page.locator('#loginAplicacaoButton', { state: 'attached' });
  await loginAplicacaoButton.waitFor();
  await loginAplicacaoButton.click();

  await page.screenshot({ path: './screenshots/screenshot02.png' });

  await delay(3000);

  await page.screenshot({ path: './screenshots/screenshot03.png' });

  console.log("Colocando o mouse sobre o item de menu 'Consulta'")
  //const menuConsulta = page.locator("#formMenuConsulta:menuConsulta_span");
  //await menuConsulta.waitFor();
  //await menuConsulta.hover();
  await page.getByText('Consulta').nth(0).hover();
  
  //await delay(10000);
  await page.screenshot({ path: './screenshots/screenshot04.png' });

  console.log("Clicando no subitem de menu 'Consulta -> Consulta de Processos de Terceiros")
  await page.getByText('Consulta a Processos de Terceiros').nth(0).click();
  //const formMenuConsulta = page.locator('div[id="formMenuConsulta:paginaConsultaProcessoTerceiros:anchor"]', { state: 'dettached' });
  //await formMenuConsulta.waitFor();
  //await formMenuConsulta.click();

  console.log("Preenchendo o input 'Número do Processo'")
  const inputNumeroProcesso = page.locator('input[name="pesquisarProcessoTerceiroForm:nrProcessoDecoration:nrProcesso"]', { state: 'attached' });
  await inputNumeroProcesso.waitFor();
  await inputNumeroProcesso.fill(processos[0]);

  console.log("Clicando no botão 'Pesquisar' ...")
  const consultarProcesso = page.locator('input[name="pesquisarProcessoTerceiroForm:searchButton"]', { state: 'attached' });
  await consultarProcesso.waitFor();
  await consultarProcesso.click();

  console.log("Clicando em ver detalhes do processo ...")
  const verDetalheProcesso = page.locator('a[name="consultaProcessoTerceirosList:0:j_id271:j_id274"]', { state: 'attached' });
  await verDetalheProcesso.waitFor();
  await verDetalheProcesso.click();

  console.log("Preenchendo a motivação para ver o processo ...")
  const txtMotivacao = page.locator('textarea[name="modal:motivacaoDecoration:motivacao"]', { state: 'attached' });
  await txtMotivacao.waitFor();
  await txtMotivacao.fill("Teste");

  console.log("Gravando motivação de acesso ao processo ...");
  const gravarMotivacaoAcesso = page.locator('input[name="modal:btnGravar"]', { state: 'attached' });
  await gravarMotivacaoAcesso.waitFor();

  console.log("Abrindo uma nova página de filto dos documentos para baixar");
  const [popup] = await Promise.all([
    new Promise(resolve => page.once('popup', resolve)),
    await gravarMotivacaoAcesso.click()
  ]);

  popup.on('close', () => console.log(' >>> EVENTO DO POPUP: A aba foi fechada.'));
  popup.on('load', async () => {
    console.log('>>> EVENTO DO POPUP: Página completamente carregada.');
    const url = page.url();
    console.log(`URL da aba: ${url}`);
  });
  popup.on('popup', popupPage => console.log(`>>> EVENTO DO POPUP: Nova aba aberta com URL: ${popupPage.url()}`));
  popup.on('request', request => console.log(`>>> EVENTO DO POPUP: Requisição feita para: ${request.url()}`));
  popup.on('response', async response => {
    console.log(`>>> EVENTO DO POPUP: Recebido resposta de: ${response.url()}`);

    if (response !== null && response.status() === 200) {
      try {
        const responseBody = await response.text();
        //console.log(responseBody);
      } catch (error) {
        console.error('Erro ao ler o corpo da resposta:', error);
      }
    }

  });

  popup.on('download', async (download) => {

    console.log(">>> EVENTO DO POPUP: Baixando arquivo")
   /* const downloadUrl = await download.url();
    const filePath = await download.path(); 

    console.log(`>>> EVENTO DO POPUP: Arquivo baixado de ${downloadUrl} para ${filePath}`);

    try {
      await download.saveAs(`./processos/${processos[0]}.pdf`);
      console.log(`Arquivo baixado salvo em: ./processos/${processos[0]}.pdf`);
    } catch (error) {
      console.error(`Erro ao salvar o arquivo: ${error}`);
    }*/
});

  page.on('framenavigated', async () => {
    const currentUrl = page.url();
    console.log(`>>> EVENTO DO POPUP: Navegou para: ${currentUrl}`);

    if (currentUrl !== 'about:blank') {
      console.log(`>>> EVENTO DO POPUP: URL final da aba: ${currentUrl}`);
    }
  });

  console.log("Abrindo os detalhes do processo");  
  console.log(await popup.title());
  console.log(await popup.url());

  console.log("Clicando no botão para baixar processo ...")
  const baixarProcesso = popup.locator('input[name="j_id850:j_id851"]', { state: 'attached' });
  await baixarProcesso.waitFor();
  await baixarProcesso.click();

  console.log("Filtrando documentos para baixar ...")
  const filtrarDocumentos = popup.locator('input[name="j_id53:botaoFiltrarDocumentos"]', { state: 'attached' });
  await filtrarDocumentos.waitFor();
  await filtrarDocumentos.click();

  await delay(6000);

  const downloadPromise = popup.waitForEvent('download');
      
  console.log("Fazendo download dos documentos ...")
  const downloadDocumentos = popup.locator('input[name="j_id53:botaoDownloadDocumentos"]', { state: 'attached' });
  await downloadDocumentos.waitFor();
  await downloadDocumentos.click();

  console.log(`Aguardando o dowload`);
  const download = await downloadPromise;

  console.log(`Salvando documento em ./processos/${processos[0]}.pdf`);
  await download.saveAs(`./processos/${processos[0]}.pdf`);

  console.log("Hora de pegar mais processo ... ");

  console.log("### Se não tem mais processo, fechar o browser ...");
  await browser.close();
})();