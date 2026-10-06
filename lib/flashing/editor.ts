import { rotatePoints, withSegmentAngle, withSegmentLength, type Point } from "./geometry"

export type Selection =
  | { kind: "point"; index: number }
  | { kind: "segment"; index: number }
  | null

export type End = "start" | "end"

export interface EditorState {
  past: Point[][]
  present: Point[]
  future: Point[][]
  selection: Selection
  // The end new segments grow from. Set whenever an endpoint is selected, so
  // the next point always continues from the endpoint the user last chose.
  origin: End
}

export type EditorAction =
  | { type: "reset"; points: Point[] }
  | { type: "replace"; points: Point[] }
  | { type: "addPoint"; point: Point }
  | { type: "select"; selection: Selection }
  | { type: "beginDrag" }
  | { type: "dragPoint"; index: number; point: Point }
  | { type: "setLength"; index: number; lengthMm: number }
  | { type: "setAngle"; index: number; angleDeg: number }
  | { type: "rotate"; degrees: number }
  | { type: "deleteSelection" }
  | { type: "undo" }
  | { type: "redo" }

const HISTORY_LIMIT = 100

export function createEditor(points: Point[] = []): EditorState {
  return { past: [], present: points, future: [], selection: null, origin: "end" }
}

function commit(state: EditorState, points: Point[], selection: Selection = state.selection): EditorState {
  return {
    ...state,
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    present: points,
    future: [],
    selection,
  }
}

export function isEndpoint(points: Point[], index: number): End | null {
  if (points.length === 0) return null
  if (index === points.length - 1) return "end"
  if (index === 0) return "start"
  return null
}

export function originIndex(state: EditorState): number | null {
  if (state.present.length === 0) return null
  return state.origin === "start" ? 0 : state.present.length - 1
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "reset":
      return createEditor(action.points)

    case "replace":
      return { ...commit(state, action.points, null), origin: "end" }

    case "addPoint": {
      const points = state.present
      if (state.origin === "start" && points.length > 0) {
        return {
          ...commit(state, [action.point, ...points], { kind: "point", index: 0 }),
          origin: "start",
        }
      }
      const next = [...points, action.point]
      return {
        ...commit(state, next, { kind: "point", index: next.length - 1 }),
        origin: "end",
      }
    }

    case "select": {
      const selection = action.selection
      if (selection?.kind === "point") {
        const end = state.present.length > 1 ? isEndpoint(state.present, selection.index) : null
        return { ...state, selection, origin: end ?? state.origin }
      }
      return { ...state, selection }
    }

    case "beginDrag":
      return { ...state, past: [...state.past, state.present].slice(-HISTORY_LIMIT), future: [] }

    case "dragPoint": {
      const present = state.present.map((point, index) =>
        index === action.index ? action.point : point
      )
      return { ...state, present }
    }

    case "setLength":
      return commit(state, withSegmentLength(state.present, action.index, action.lengthMm))

    case "setAngle":
      return commit(state, withSegmentAngle(state.present, action.index, action.angleDeg))

    case "rotate":
      if (state.present.length < 2) return state
      return commit(state, rotatePoints(state.present, action.degrees))

    case "deleteSelection": {
      const selection = state.selection
      if (!selection) return state
      const points = state.present
      const removeIndex =
        selection.kind === "point"
          ? selection.index
          : selection.index === 0
            ? 0
            : selection.index + 1
      return commit(
        state,
        points.filter((_, index) => index !== removeIndex),
        null
      )
    }

    case "undo": {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        selection: null,
      }
    }

    case "redo": {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: rest,
        selection: null,
      }
    }
  }
}
