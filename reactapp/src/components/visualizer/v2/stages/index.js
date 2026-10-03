import ArrayStage from "./ArrayStage";
import MatrixStage from "./MatrixStage";
import TreeStage from "./TreeStage";
import ListStage from "./ListStage";
import GraphStage from "./GraphStage";
import BitsStage from "./BitsStage";
import BarsStage from "./BarsStage";
import VarsStage from "./VarsStage";
import StackStage from "./StackStage";
import QueueStage from "./QueueStage";
import IntervalsStage from "./IntervalsStage";
import CallstackStage from "./CallstackStage";
import StackAux from "../auxiliary/StackAux";
import QueueAux from "../auxiliary/QueueAux";
import TableAux from "../auxiliary/TableAux";
import CallstackAux from "../auxiliary/CallstackAux";
import OpsAux from "../auxiliary/OpsAux";

/** StageKind -> component. Import-only registry; one file per kind. */
export const STAGES = {
  array: ArrayStage,
  matrix: MatrixStage,
  tree: TreeStage,
  list: ListStage,
  graph: GraphStage,
  bits: BitsStage,
  bars: BarsStage,
  vars: VarsStage,
  stack: StackStage,
  queue: QueueStage,
  intervals: IntervalsStage,
  callstack: CallstackStage,
};

/** Aux kind -> component. */
export const AUX = {
  stack: StackAux,
  queue: QueueAux,
  table: TableAux,
  callstack: CallstackAux,
  ops: OpsAux,
};
