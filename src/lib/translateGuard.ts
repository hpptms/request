// ブラウザの翻訳機能（Chrome/Edge の Google 翻訳など）対策。
// 翻訳はテキストノードを <font> 要素に差し替えるため、React が後から元の
// テキストノードを removeChild / insertBefore しようとすると
// "NotFoundError: Failed to execute 'removeChild' on 'Node'" で落ち、
// アプリ全体が白画面になる (https://github.com/facebook/react/issues/11538)。
// 親子関係が崩れているときだけ例外を投げずに素通りさせる。
// 翻訳されていない通常時は親子関係が正しいので挙動は変わらない。
export function installTranslateGuard(): void {
  if (typeof Node !== "function" || !Node.prototype) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
