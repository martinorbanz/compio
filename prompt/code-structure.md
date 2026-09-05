# Code Archtecture

the codebase follows a self-repeating "bulletproof style" folder structure so things can be moved with as little impact as possible. related types, utils etc. are always kept on the highest folder level they are being used.

## Folder structure

### Example: App

```text
src/
└── features/
    └── discussions/
        ├── components/
        │   └── discussions/
        │       ├── components/
        │       │   └── discussion-item.tsx   <-- Sub-component used by the main component
        │       ├── api/
        │       │   ├── discussion.ts
        │       │   ├── discussion-status-enum.ts
        │       │   └── index.ts
        │       ├── hooks/
        │       │   ├── use-create-discussion.ts
        │       │   ├── use-discussion.ts
        │       │   └── index.ts
        │       ├── utils/
        │       │   ├── create-discussion.ts
        │       │   ├── get-discussion.ts
        │       │   ├── format-discussion-date.ts
        │       │   └── index.ts
        │       ├── discussions.tsx      <-- Main component; local types *not* used by sub-modules live here
        │       └── index.ts
        └── index.ts                 <-- Entry point exporting only what the app needs
```
