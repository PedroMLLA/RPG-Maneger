-- =====================================================================
-- RPG Manager · V3 · Correção da regra "ver campanha"
--
-- Problema: ao criar uma campanha, o site pede "cria e me devolve a
-- linha". Para devolver, o banco confere a regra de leitura, que usava
-- só a função pode_ver(). Essa função enxerga a tabela como estava
-- ANTES do comando (sem a campanha nova), então dizia "não pode ver"
-- e o banco recusava a criação inteira.
--
-- Correção: conferir primeiro "dono = auth.uid()" direto na linha
-- (que já enxerga a campanha nova). Os jogadores continuam passando
-- pela pode_ver().
--
-- Como usar: SQL Editor → cole tudo → Run.
-- =====================================================================

drop policy if exists "ver campanha" on public.campanhas;
create policy "ver campanha" on public.campanhas
    for select to authenticated
    using (dono = auth.uid() or public.pode_ver(id));
