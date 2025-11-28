# 🎬 Get Started with Chess Theory Video Generator

Welcome! This guide will help you create your first chess theory video in under 5 minutes.

## ⚡ Super Quick Start

```bash
# 1. Install dependencies
./setup.sh

# 2. Generate your first video
python main.py -i examples/ruy_lopez.txt -o my_first_video.mp4

# 3. Watch the video!
open my_first_video.mp4
```

That's it! You've just created your first chess theory video! 🎉

## 📚 What Just Happened?

The app took the Ruy Lopez theory from `examples/ruy_lopez.txt`:

```text
Opening: Ruy Lopez (Spanish Opening)

1. e4 - White opens with the king's pawn...
2. e5 - Black mirrors White's move...
3. Nf3 - White develops the knight...
...
```

And generated a professional video showing:
- ✅ An intro screen with the title
- ✅ Animated chess moves
- ✅ Annotations explaining each move
- ✅ An outro screen with the final position

## 🎯 Create Your Own Theory

Create a file called `my_theory.txt`:

```text
Opening: My Favorite Opening

1. e4 - I always start with the king's pawn
2. c5 - The Sicilian! Sharp and aggressive
3. Nf3 - Developing the knight naturally
4. d6 - Black solidifies the center
5. d4 - Time to challenge in the center!
```

Generate the video:

```bash
python main.py -i my_theory.txt -o my_theory.mp4
```

## 🎨 Customize Your Video

### Change Board Style
```bash
python main.py -i theory.txt -o video.mp4 --style wood
```

Try: `default`, `wood`, `marble`, `blue`, `green`

### Adjust Speed
```bash
# Faster (1 second per move)
python main.py -i theory.txt -o fast.mp4 --duration 1

# Slower (3 seconds per move)
python main.py -i theory.txt -o slow.mp4 --duration 3
```

### Change Quality
```bash
# Small file for social media
python main.py -i theory.txt -o social.mp4 --size 600

# High quality for presentations
python main.py -i theory.txt -o hq.mp4 --size 1280 --fps 60
```

## 📖 Learn More

| Document | What's Inside |
|----------|---------------|
| [QUICKSTART.md](QUICKSTART.md) | Detailed 5-minute tutorial |
| [CHEATSHEET.md](CHEATSHEET.md) | Quick command reference |
| [README.md](README.md) | Complete documentation |
| [USAGE.md](USAGE.md) | All features explained |
| [examples/](examples/) | 6 example theories |

## 🎓 Chess Notation Basics

Don't know chess notation? Here's a quick guide:

### Pieces
- **K** = King
- **Q** = Queen  
- **R** = Rook
- **B** = Bishop
- **N** = Knight
- **(no letter)** = Pawn

### Moves
- `e4` = Pawn to e4
- `Nf3` = Knight to f3
- `Bxc6` = Bishop captures on c6
- `O-O` = Castle kingside
- `Qd8+` = Queen to d8, giving check

### Example Game
```text
1. e4 e5      - Both sides push center pawns
2. Nf3 Nc6    - Knights develop
3. Bc4 Bc5    - Bishops develop (Italian Game!)
```

## 🔧 Troubleshooting

### Problem: "Module not found"
**Solution:**
```bash
pip install -r requirements.txt
```

### Problem: "Invalid move"
**Solution:** Check your chess notation. Moves must be legal!
- ✅ `e4` (correct)
- ❌ `e9` (invalid - no such square)

### Problem: Video won't play
**Solution:** Try a different player like VLC, or convert:
```bash
ffmpeg -i output.mp4 -c:v libx264 output_fixed.mp4
```

## 💡 Pro Tips

1. **Test First**: Use `--size 600 --duration 1` for quick tests
2. **Check Examples**: Look at files in `examples/` for inspiration
3. **Start Simple**: Begin with 5-10 moves, then expand
4. **Add Details**: Good annotations make better videos
5. **Experiment**: Try different styles and timings

## 🚀 Next Steps

1. ✅ Generate a video from examples
2. ✅ Create your own theory file
3. ✅ Experiment with styles
4. ✅ Try different timing
5. ✅ Share your chess content!

## 📞 Need Help?

1. Check [CHEATSHEET.md](CHEATSHEET.md) for quick answers
2. Read [USAGE.md](USAGE.md) for detailed help
3. Run tests: `python test_app.py`
4. Enable verbose mode: `python main.py -i theory.txt -o video.mp4 -v`

## 🎯 Common Use Cases

### For Teachers
Create instructional videos for your students:
```bash
python main.py -i lesson1.txt -o lesson1_video.mp4 --style default
```

### For Content Creators
Generate YouTube content:
```bash
python main.py -i opening.txt -o youtube.mp4 --size 1280 --fps 60
```

### For Students
Study openings by creating videos:
```bash
python main.py -i my_repertoire.txt -o study.mp4
```

### For Social Media
Create short clips:
```bash
python main.py -i trap.txt -o instagram.mp4 --size 600 --duration 1
```

## 🎬 Example Commands

```bash
# All examples
python main.py -i examples/ruy_lopez.txt -o ruy_lopez.mp4
python main.py -i examples/italian_game.txt -o italian.mp4
python main.py -i examples/sicilian_defense.txt -o sicilian.mp4

# Different styles
python main.py -i theory.txt -o wood_style.mp4 --style wood
python main.py -i theory.txt -o marble_style.mp4 --style marble

# With thumbnail
python main.py -i theory.txt -o video.mp4 --thumbnail
```

## ✨ Success!

You're now ready to create amazing chess theory videos! 

Start with the examples, experiment with settings, and create your own content.

**Happy chess video creation!** ♟️🎬

---

Questions? Check the other documentation files or run `python test_app.py` to verify your setup.
