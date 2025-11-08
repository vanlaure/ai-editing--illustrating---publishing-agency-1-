
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const searchPluginKey = new PluginKey('search');

interface SearchResult {
  from: number;
  to: number;
}

const searchAndDecorate = (doc, searchTerm: string, caseSensitive: boolean): { decorations: DecorationSet, results: SearchResult[] } => {
  const decorations: Decoration[] = [];
  const results: SearchResult[] = [];
  if (!searchTerm) {
    return { decorations: DecorationSet.empty, results: [] };
  }

  const searchText = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  doc.descendants((node, pos) => {
    if (!node.isText) {
      return;
    }

    const nodeText = caseSensitive ? node.text : node.text.toLowerCase();
    let index = 0;
    let match;

    while ((match = nodeText.indexOf(searchText, index)) !== -1) {
      const from = pos + match;
      const to = from + searchTerm.length;
      decorations.push(Decoration.inline(from, to, { class: 'search-result' }));
      results.push({ from, to });
      index = match + searchTerm.length;
    }
  });

  return { decorations: DecorationSet.create(doc, decorations), results };
};

export const SearchExtension = Extension.create({
  name: 'search',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, results: [], searchTerm: '' };
          },
          apply(tr, value) {
            const meta = tr.getMeta(this.key);
            if (meta && meta.searchTerm !== undefined) {
                const { decorations, results } = searchAndDecorate(tr.doc, meta.searchTerm, meta.caseSensitive);
                return { decorations, results, searchTerm: meta.searchTerm };
            }

            if (value.decorations.size) {
              const decorations = value.decorations.map(tr.mapping, tr.doc);
              // Simple re-search on document change to keep results updated
              const { decorations: newDecorations, results } = searchAndDecorate(tr.doc, value.searchTerm, false);
              return { ...value, decorations: newDecorations, results };
            }
            
            return value;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});
