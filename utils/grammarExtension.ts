

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const grammarPluginKey = new PluginKey('grammar');

// A robust search function that finds text across node boundaries (e.g., across bold/italic marks)
const findOccurrences = (doc, searchText) => {
    const results: { from: number, to: number }[] = [];
    if (!searchText || !doc) return results;

    const lowerSearchText = searchText.toLowerCase();
    const searchTextLength = searchText.length;

    // Iterate through all possible start positions in the document
    for (let pos = 1; pos <= doc.content.size - searchTextLength; pos++) {
        const textSlice = doc.textBetween(pos, pos + searchTextLength, '\0', '\0');
        
        if (textSlice.toLowerCase() === lowerSearchText) {
            results.push({ from: pos, to: pos + searchTextLength });
            // Jump forward to avoid finding overlapping matches of the same string
            pos += searchTextLength -1;
        }
    }
    return results;
};


export const GrammarExtension = Extension.create({
    name: 'grammar',

    addProseMirrorPlugins() {
        const extensionThis = this;
        return [
            new Plugin({
                key: grammarPluginKey,
                state: {
                    init() {
                        return { decorations: DecorationSet.empty, issueMap: new Map() };
                    },
                    apply(tr, value, oldState, newState) {
                        const meta = tr.getMeta(this.key);

                        if (meta && meta.issues !== undefined) {
                            const doc = tr.doc || newState.doc;
                            const decorations: Decoration[] = [];
                            const newIssueMap = new Map();

                            meta.issues.forEach((issue: any, issueIndex: number) => {
                                const occurrences = findOccurrences(doc, issue.original);
                                
                                occurrences.forEach(({ from, to }) => {
                                    const decorationId = `${issueIndex}-${from}`;
                                    
                                    const isAlreadyDecorated = decorations.some(d => d.from === from && d.to === to);
                                    if (!isAlreadyDecorated) {
                                        newIssueMap.set(decorationId, issue);
                                        decorations.push(Decoration.inline(from, to, {
                                            class: `suggestion-highlight type-${issue.type}`,
                                            'data-issue-id': decorationId,
                                            title: issue.explanation || '',
                                        }));
                                    }
                                });
                            });
                            
                            return { decorations: DecorationSet.create(doc, decorations), issueMap: newIssueMap };
                        }
                        
                        if (value.decorations.size) {
                            const decorations = value.decorations.map(tr.mapping, tr.doc);
                            return { ...value, decorations };
                        }

                        return value;
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state)?.decorations;
                    },
                    handleClickOn(view, pos, node, nodePos, event, direct) {
                        const target = event.target as HTMLElement;
                        const decorationElement = target.closest('.suggestion-highlight');
                        if (decorationElement) {
                            const issueId = decorationElement.getAttribute('data-issue-id');
                            const pluginState = this.getState(view.state);
                            if (issueId && pluginState.issueMap.has(issueId)) {
                                const issue = pluginState.issueMap.get(issueId);
                                
                                const decorationsAtPos = pluginState.decorations.find(pos, pos);
                                const clickedDecoration = decorationsAtPos.find(d => d.spec['data-issue-id'] === issueId);
                                
                                if (clickedDecoration) {
                                    // Set selection to the clicked issue for the bubble to position correctly
                                    const tr = view.state.tr.setSelection(
                                        TextSelection.create(view.state.doc, clickedDecoration.from)
                                    );
                                    view.dispatch(tr);
                                    
                                    const customEvent = new CustomEvent('suggestion-click', {
                                        detail: {
                                            issue,
                                            from: clickedDecoration.from,
                                            to: clickedDecoration.to,
                                            rect: decorationElement.getBoundingClientRect(),
                                        }
                                    });
                                    view.dom.dispatchEvent(customEvent);
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                },
            }),
        ];
    },
});
