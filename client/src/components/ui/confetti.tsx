import { motion, AnimatePresence } from "framer-motion";
import { type ConfettiPiece } from "@/hooks/useConfetti";

interface ConfettiProps {
  isActive: boolean;
  pieces: ConfettiPiece[];
}

/**
 * Confetti celebration component.
 * Renders animated confetti pieces that fall from the top of the screen.
 */
export function Confetti({ isActive, pieces }: ConfettiProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: piece.rotation,
                scale: piece.scale,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
                opacity: [1, 1, 0.8, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute"
              style={{
                left: `${piece.x}%`,
              }}
            >
              {/* Confetti piece shapes */}
              {piece.id % 3 === 0 ? (
                // Circle
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: piece.color }}
                />
              ) : piece.id % 3 === 1 ? (
                // Square
                <div
                  className="w-3 h-3"
                  style={{ backgroundColor: piece.color }}
                />
              ) : (
                // Rectangle
                <div
                  className="w-2 h-4"
                  style={{ backgroundColor: piece.color }}
                />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Achievement celebration modal with confetti.
 */
interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function CelebrationModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
}: CelebrationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[99] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-[99] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
              {/* Icon with glow effect */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              >
                {icon || (
                  <span className="text-4xl">🏆</span>
                )}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold font-display text-foreground mb-2"
              >
                {title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-6"
              >
                {description}
              </motion.p>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Awesome!
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
