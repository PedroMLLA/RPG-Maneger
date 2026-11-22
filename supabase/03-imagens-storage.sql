-- =====================================================================
-- RPG Manager · V3 · Passo 3: imagens no Supabase Storage
--
-- Antes, cada imagem (mapa, galeria, tokens) virava um texto enorme
-- (base64) guardado DENTRO dos dados da campanha. Cada salvamento
-- mandava tudo de novo pela internet. Agora a imagem vira um ARQUIVO
-- no Storage, e os dados guardam só o endereço dela (uma linha curta).
--
-- Como usar: SQL Editor → cole tudo → Run. Pode rodar de novo.
--
-- Organização: uma pasta por campanha, com nomes sorteados:
--   imagens/<id da campanha>/<nome sorteado>.webp
--
-- Segurança:
--   - o bucket é "público para ler": quem tem o endereço vê a imagem
--     (é assim que o <img> do jogador consegue mostrar). Os nomes são
--     sorteados e longos, então ninguém adivinha o endereço;
--   - só o MESTRE (dono da campanha) envia ou apaga arquivos na pasta
--     da campanha dele;
--   - só imagens, de até 5 MB.
-- =====================================================================


-- ---------- O bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set
    public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


-- ---------- Função de apoio ----------
-- O primeiro pedaço do caminho ("<id da campanha>/...") é de uma
-- campanha deste mestre? Compara como texto: se alguém mandar um
-- caminho que não é um id, a resposta é só "não", sem dar erro.
create or replace function public.eh_dono_da_pasta(p_caminho text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from campanhas
        where id::text = split_part(p_caminho, '/', 1)
          and dono = auth.uid()
    );
$$;


-- ---------- Regras (storage.objects é a "tabela" dos arquivos) ----------
drop policy if exists "mestre envia imagem" on storage.objects;
create policy "mestre envia imagem" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'imagens' and public.eh_dono_da_pasta(name));

drop policy if exists "mestre troca imagem" on storage.objects;
create policy "mestre troca imagem" on storage.objects
    for update to authenticated
    using (bucket_id = 'imagens' and public.eh_dono_da_pasta(name))
    with check (bucket_id = 'imagens' and public.eh_dono_da_pasta(name));

drop policy if exists "mestre apaga imagem" on storage.objects;
create policy "mestre apaga imagem" on storage.objects
    for delete to authenticated
    using (bucket_id = 'imagens' and public.eh_dono_da_pasta(name));
