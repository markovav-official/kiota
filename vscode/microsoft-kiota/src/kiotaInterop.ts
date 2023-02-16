import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc/node';

export async function connectToKiota<T>(callback:(connection: rpc.MessageConnection) => Promise<T | undefined>): Promise<T | undefined> {
  const childProcess = cp.spawn("C:\\sources\\github\\kiota\\src\\Kiota.JsonRpcServer\\bin\\Debug\\net7.0\\Kiota.JsonRpcServer.exe", ["stdio"]);
  let connection = rpc.createMessageConnection(
    new rpc.StreamMessageReader(childProcess.stdout),
    new rpc.StreamMessageWriter(childProcess.stdin));
  connection.listen();
  try {
    return await callback(connection);
  } catch (error) {
    console.error(error);
    return undefined;
  } finally {
    connection.dispose();
    childProcess.kill();
  }
}

export interface KiotaLogEntry {
  level: number;
  message: string;
}

export interface KiotaOpenApiNode {
    segment: string,
    path: string,
    children: KiotaOpenApiNode[],
    selected: boolean,
}

export interface KiotaShowConfiguration {
    includeFilters: string[];
    excludeFilters: string[];
    descriptionPath: string;
}

export interface KiotaShowResult {
    logs: KiotaLogEntry[];
    rootNode?: KiotaOpenApiNode;
}