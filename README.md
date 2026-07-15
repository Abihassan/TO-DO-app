# Quest — Gamified To-Do App

A vibrant, playful task manager for kids (and grown-up kids) built with React Native
(.jsx), Tailwind CSS via NativeWind, and Expo. No backend, no auth — all state lives
in a single React Context, pre-loaded with gamified mock tasks.

> **Note on the reference image:** no image file actually came through with the brief
> — only the text description. This build follows the structural spec in the prompt
> (gradient header with progress ring → category slider → active task cards →
> collapsible completed section → weekly chart) with an original vibrant/gamified
> visual treatment. If you have the actual reference image, share it and I can adjust
> spacing, component order, or layout to match it exactly.

## Stack

- **Expo** (React Native, functional components + hooks only)
- **NativeWind v4** — Tailwind CSS utility classes on native components
- **React Context** (`context/TodoContext.jsx`) — centralized state, mock data, no backend
- **react-native-gesture-handler** — swipe-to-edit / swipe-to-delete
- **react-native-svg** — animated progress ring
- **expo-linear-gradient** — header, FAB, and chart bar gradients
- **expo-haptics** — tactile feedback on checkbox taps, swipes, and task creation
- **expo-blur** — glassy modal backdrop
- **@expo-google-fonts/baloo-2** + **@expo-google-fonts/nunito** — bubbly display type
  paired with a friendly, readable body face

## Getting started

```bash
npm install
npx expo start
```

Open in Expo Go, an iOS Simulator, or an Android Emulator.

## Project structure

```
App.jsx                          Font loading, providers, splash screen
context/TodoContext.jsx          Mock tasks, CRUD logic, derived counts/progress
constants/theme.js                Category + priority metadata (colors, emoji)
utils/date.js                     Due-date formatting/comparison helpers
screens/DashboardScreen.jsx       Composes the whole dashboard
components/
  Header.jsx                      Gradient greeting header + progress ring
  ProgressRing.jsx                 Animated SVG completion ring
  CategorySlider.jsx              Horizontal chips with floating count badges
  TaskCard.jsx                     Active task card, tactile checkbox, confetti
  SwipeableTaskRow.jsx            Swipe-to-edit (yellow) / swipe-to-delete (red)
  ConfettiBurst.jsx               Celebration animation on task completion
  CompletedSection.jsx            Collapsible accordion of completed tasks
  WeeklyChart.jsx                  Mock weekly completion bar chart
  AddTaskModal.jsx                Bottom-sheet create/edit form
  FAB.jsx                          Gradient floating action button
  EmptyState.jsx                   Friendly empty-state illustration
```

## Feature notes

- **Mock data**: `TodoContext` seeds 8 tasks across all 4 categories (School, Chores,
  Gaming, Fitness), some already completed, to demonstrate every state on first launch.
- **Swipe gestures**: swipe a card left to reveal a yellow "Edit" action, swipe right
  for a red "Delete" action — both open/trigger and auto-close the row.
- **Celebration**: completing a task triggers a 10-piece confetti burst around the
  checkbox plus a satisfying pop/spring animation and a haptic tap.
- **Completed accordion**: collapses/expands with a smooth `LayoutAnimation`, and each
  row can be swiped to un-complete or delete.
- **Category filtering**: tapping a category chip filters both the active list and the
  completed list; badge counts update live from context state.
- **Weekly chart**: renders `weeklyStats` mock data as gradient bars against a faint
  "total" track, so both completed and total quest counts are visible at a glance.

## Design tokens

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FFF7ED` | App background |
| `grape` | `#7C3AED` | Primary accent, header gradient, FAB |
| `bubble` | `#EC4899` | Header gradient endpoint |
| `sunshine` | `#FFC93C` | Progress ring, achievement badge |
| `coral` | `#FF6B6B` | Chores category, delete action |
| `teal` | `#14B8A6` | Fitness category |
| `sky` | `#3B82F6` | School category |
| `mint` | `#22E584` | Completed/done state |
| `priorityHigh/Medium/Low` | `#FF3B5C` / `#FFB020` / `#22C55E` | Priority badges |

Typefaces: **Baloo 2** (display/headings, bubbly and rounded) paired with **Nunito**
(body copy, friendly and highly legible).
